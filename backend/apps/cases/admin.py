from django.contrib import admin
from .models import SupportCase, CaseNote, CaseActivity


class CaseNoteInline(admin.TabularInline):
    model  = CaseNote
    extra  = 0
    fields = ['author', 'content', 'is_private', 'created_at']
    readonly_fields = ['created_at']


class CaseActivityInline(admin.TabularInline):
    model  = CaseActivity
    extra  = 0
    fields = ['activity_type', 'actor', 'description', 'created_at']
    readonly_fields = ['created_at']


@admin.register(SupportCase)
class SupportCaseAdmin(admin.ModelAdmin):
    list_display  = ['case_number', 'student', 'case_type', 'priority', 'status', 'counselor', 'created_at']
    list_filter   = ['status', 'priority', 'case_type']
    search_fields = ['case_number', 'student__email', 'title']
    raw_id_fields = ['student', 'counselor']
    inlines       = [CaseNoteInline, CaseActivityInline]
    date_hierarchy = 'created_at'


@admin.register(CaseNote)
class CaseNoteAdmin(admin.ModelAdmin):
    list_display  = ['case', 'author', 'is_private', 'created_at']
    list_filter   = ['is_private']