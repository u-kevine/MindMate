from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'case', 'created_at', 'updated_at']
    search_fields = ['title', 'participants__email']
    filter_horizontal = ['participants']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['sender', 'recipient', 'is_read', 'created_at']
    list_filter   = ['is_read']
    search_fields = ['sender__email', 'recipient__email', 'content']
    date_hierarchy = 'created_at'