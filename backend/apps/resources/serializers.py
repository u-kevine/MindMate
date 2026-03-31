"""Resources Serializers"""
from rest_framework import serializers
from .models import Resource, ResourceCategory, ResourceView


class ResourceCategorySerializer(serializers.ModelSerializer):
    resource_count = serializers.SerializerMethodField()

    class Meta:
        model  = ResourceCategory
        fields = ['id', 'name', 'slug', 'icon', 'color', 'order', 'resource_count']

    def get_resource_count(self, obj):
        return obj.resources.filter(is_published=True).count()


class ResourceSerializer(serializers.ModelSerializer):
    category_name  = serializers.ReadOnlyField(source='category.name')
    category_icon  = serializers.ReadOnlyField(source='category.icon')
    category_color = serializers.ReadOnlyField(source='category.color')
    uploader_name  = serializers.ReadOnlyField(source='uploaded_by.full_name')
    has_viewed     = serializers.SerializerMethodField()

    class Meta:
        model  = Resource
        fields = [
            'id', 'title', 'slug', 'description', 'content_type',
            'content', 'file', 'thumbnail', 'external_url',
            'read_time_minutes', 'view_count', 'is_featured', 'is_published',
            'category', 'category_name', 'category_icon', 'category_color',
            'uploader_name', 'has_viewed', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'view_count', 'created_at', 'updated_at']

    def get_has_viewed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ResourceView.objects.filter(resource=obj, user=request.user).exists()
        return False


class ResourceListSerializer(serializers.ModelSerializer):
    category_name  = serializers.ReadOnlyField(source='category.name')
    category_icon  = serializers.ReadOnlyField(source='category.icon')
    category_color = serializers.ReadOnlyField(source='category.color')

    class Meta:
        model  = Resource
        fields = [
            'id', 'title', 'slug', 'description', 'content_type',
            'read_time_minutes', 'view_count', 'is_featured',
            'category_name', 'category_icon', 'category_color', 'thumbnail',
            'created_at',
        ]


class CreateResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Resource
        fields = [
            'title', 'description', 'content_type', 'content',
            'file', 'thumbnail', 'external_url', 'read_time_minutes',
            'category', 'is_featured', 'is_published',
        ]

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)