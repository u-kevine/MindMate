"""Accounts Views"""
from django.contrib.auth import get_user_model
from apps.core.email_service import send_welcome_email
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from .models import StudentProfile, CounselorProfile
from .serializers import (
    CustomTokenObtainPairSerializer, RegisterSerializer,
    UserSerializer, UserListSerializer,
    ChangePasswordSerializer, UpdatePreferencesSerializer,
    CounselorProfileSerializer, StudentProfileSerializer,
)
from .permissions import IsAdminUser, IsOwnerOrAdmin

User = get_user_model()


class LoginView(TokenObtainPairView):
    """Student / Counselor / Admin login."""
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(summary='Login and obtain JWT tokens')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """Blacklist the refresh token on logout."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary='Logout and blacklist token')
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Token invalide.'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    def perform_create(self, serializer):
        user = serializer.save()
        try:
            send_welcome_email(user)
        except Exception as e:
            print(f'[EMAIL] welcome failed: {e}')
    """Register a new student or counselor."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary='Register new user (student or counselor)')
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'detail': 'Compte créé avec succès.', 'user_id': user.id},
            status=status.HTTP_201_CREATED
        )


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update the currently authenticated user's profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    @extend_schema(summary='Get current user profile')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary='Change password')
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Mot de passe modifié avec succès.'})


class UpdatePreferencesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary='Update language/theme preferences')
    def patch(self, request):
        serializer = UpdatePreferencesSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ─── Admin-facing user management ─────────────────────────────────────────────

class UserListView(generics.ListCreateAPIView):
    """List all users (admin only)."""
    serializer_class   = UserListSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['role', 'is_active']
    search_fields      = ['email', 'first_name', 'last_name']
    ordering_fields    = ['date_joined', 'last_name']

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or deactivate a user (admin only)."""
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset           = User.objects.all()


class CounselorListView(generics.ListAPIView):
    """List available counselors (students can see this to choose one)."""
    serializer_class   = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(
            role=User.Role.COUNSELOR, is_active=True
        ).select_related('counselor_profile')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = []
        for user in qs:
            profile = getattr(user, 'counselor_profile', None)
            data.append({
                'id':        user.id,
                'full_name': user.full_name,
                'email':     user.email,
                'specialty': profile.specialty if profile else '',
                'is_available': profile.is_available if profile else True,
                'active_case_count': profile.active_case_count if profile else 0,
            })
        return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Role-based dashboard stats."""
    user = request.user
    if user.is_admin():
        from apps.cases.models import SupportCase
        from apps.resources.models import Resource
        return Response({
            'total_students':   User.objects.filter(role='student').count(),
            'total_counselors': User.objects.filter(role='counselor').count(),
            'open_cases':       SupportCase.objects.filter(status='open').count(),
            'in_progress_cases': SupportCase.objects.filter(status='in_progress').count(),
            'resolved_cases':   SupportCase.objects.filter(status='resolved').count(),
            'total_resources':  Resource.objects.filter(is_published=True).count(),
        })
    elif user.is_counselor():
        from apps.cases.models import SupportCase
        cases = SupportCase.objects.filter(counselor=user)
        return Response({
            'open_cases':       cases.filter(status='open').count(),
            'in_progress_cases': cases.filter(status='in_progress').count(),
            'resolved_cases':   cases.filter(status='resolved').count(),
            'total_assigned':   cases.count(),
        })
    else:
        from apps.cases.models import SupportCase
        from apps.messages_app.models import Message
        cases = SupportCase.objects.filter(student=user)
        unread = Message.objects.filter(recipient=user, is_read=False).count()
        return Response({
            'active_cases':  cases.filter(status__in=['open', 'in_progress']).count(),
            'resolved_cases': cases.filter(status='resolved').count(),
            'unread_messages': unread,
            'total_cases':   cases.count(),
        })