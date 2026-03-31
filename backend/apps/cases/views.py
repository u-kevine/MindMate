"""Cases Views"""
from django.utils import timezone
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from .models import SupportCase, CaseNote, CaseActivity
from .serializers import (
    SupportCaseSerializer, SupportCaseListSerializer,
    CreateCaseSerializer, UpdateCaseStatusSerializer,
    AddCaseNoteSerializer, CaseNoteSerializer,
)
from apps.accounts.permissions import IsAdminOrCounselor, IsRelatedToCase


class CaseListCreateView(generics.ListCreateAPIView):
    """
    GET  — list cases scoped to the user's role.
    POST — student creates a new case.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'priority', 'case_type']
    search_fields      = ['title', 'case_number', 'student__first_name',
                          'student__last_name', 'student__email']
    ordering_fields    = ['created_at', 'updated_at', 'priority']

    def get_queryset(self):
        user = self.request.user
        qs = SupportCase.objects.select_related('student', 'counselor')
        if user.role == 'student':
            return qs.filter(student=user)
        elif user.role == 'counselor':
            return qs.filter(counselor=user)
        return qs  # admin sees all

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateCaseSerializer
        return SupportCaseListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            # Only students submit cases
            from apps.accounts.permissions import IsStudentUser
            return [permissions.IsAuthenticated(), IsStudentUser()]
        return [permissions.IsAuthenticated()]


class CaseDetailView(generics.RetrieveAPIView):
    """Full case detail — available to related parties and admins."""
    serializer_class   = SupportCaseSerializer
    permission_classes = [permissions.IsAuthenticated, IsRelatedToCase]

    def get_queryset(self):
        return SupportCase.objects.select_related('student', 'counselor').prefetch_related(
            'notes__author', 'activities__actor'
        )


class UpdateCaseView(APIView):
    """Counselors/admins update status, priority, counselor, session info."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrCounselor]

    @extend_schema(summary='Update case status, priority or counselor assignment')
    def patch(self, request, pk):
        try:
            case = SupportCase.objects.get(pk=pk)
        except SupportCase.DoesNotExist:
            return Response({'detail': 'Dossier introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCaseStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Track old values for activity log
        old_status   = case.status
        old_priority = case.priority
        old_counselor = case.counselor

        # Apply updates
        if 'status' in data:
            case.status = data['status']
            if data['status'] == 'resolved' and not case.resolved_at:
                case.resolved_at = timezone.now()
        if 'priority' in data:
            case.priority = data['priority']
        if 'counselor' in data:
            case.counselor = data['counselor']
        if 'next_session_at' in data:
            case.next_session_at = data['next_session_at']
        if 'session_location' in data:
            case.session_location = data['session_location']
        case.save()

        # Log activities
        if old_status != case.status:
            CaseActivity.objects.create(
                case=case, actor=request.user,
                activity_type=CaseActivity.ActivityType.STATUS_CHANGE,
                description=f'Statut modifié par {request.user.full_name}',
                old_value=old_status, new_value=case.status,
            )
        if old_counselor != case.counselor and case.counselor:
            CaseActivity.objects.create(
                case=case, actor=request.user,
                activity_type=CaseActivity.ActivityType.COUNSELOR_ASSIGN,
                description=f'Conseiller assigné : {case.counselor.full_name}',
                old_value=old_counselor.full_name if old_counselor else '',
                new_value=case.counselor.full_name,
            )

        return Response(SupportCaseSerializer(case, context={'request': request}).data)


class AddNoteView(APIView):
    """Add a counselor note to a case."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrCounselor]

    def post(self, request, pk):
        try:
            case = SupportCase.objects.get(pk=pk)
        except SupportCase.DoesNotExist:
            return Response({'detail': 'Dossier introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AddCaseNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save(case=case, author=request.user)

        CaseActivity.objects.create(
            case=case, actor=request.user,
            activity_type=CaseActivity.ActivityType.NOTE_ADDED,
            description=f'Note ajoutée par {request.user.full_name}',
        )
        return Response(CaseNoteSerializer(note).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def case_stats(request):
    """Admin/counselor-facing case statistics."""
    user = request.user
    qs = SupportCase.objects.all()
    if user.role == 'counselor':
        qs = qs.filter(counselor=user)

    return Response({
        'open':        qs.filter(status='open').count(),
        'in_progress': qs.filter(status='in_progress').count(),
        'resolved':    qs.filter(status='resolved').count(),
        'urgent':      qs.filter(priority='urgent').count(),
        'by_type': {
            ct.value: qs.filter(case_type=ct.value).count()
            for ct in SupportCase.CaseType
        },
    })