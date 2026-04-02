"""Resources Views"""
from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Resource, ResourceCategory, ResourceView
from .serializers import (
    ResourceSerializer, ResourceSerializer,
    ResourceCategorySerializer, CreateResourceSerializer,
)
from apps.accounts.permissions import IsAdminUser


class ResourceCategoryListView(generics.ListAPIView):
    serializer_class   = ResourceCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset           = ResourceCategory.objects.all()


class ResourceListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['category', 'content_type', 'is_featured']
    search_fields      = ['title', 'description']
    ordering_fields    = ['created_at', 'view_count', 'read_time_minutes']

    def get_queryset(self):
        qs = Resource.objects.select_related('category', 'uploaded_by')
        # Non-admins only see published resources
        if self.request.user.role != 'admin':
            qs = qs.filter(is_published=True)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateResourceSerializer
        return ResourceSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]


class ResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Resource.objects.select_related('category', 'uploaded_by')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return CreateResourceSerializer
        return ResourceSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        # Record view
        ResourceView.objects.get_or_create(resource=obj, user=request.user)
        obj.view_count = ResourceView.objects.filter(resource=obj).count()
        obj.save(update_fields=['view_count'])
        serializer = self.get_serializer(obj, context={'request': request})
        return Response(serializer.data)