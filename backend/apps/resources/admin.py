from django.contrib import admin
from .models import Resource, ResourceCategory, ResourceView


@admin.register(ResourceCategory)
class ResourceCategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'icon', 'order']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display  = ['title', 'category', 'content_type', 'is_published', 'is_featured', 'view_count', 'created_at']
    list_filter   = ['content_type', 'is_published', 'is_featured', 'category']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'