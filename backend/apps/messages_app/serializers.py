"""Messages Serializers"""
from django.utils import timezone
from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name    = serializers.ReadOnlyField(source='sender.full_name')
    sender_role    = serializers.ReadOnlyField(source='sender.role')
    sender_initials = serializers.ReadOnlyField(source='sender.initials')

    class Meta:
        model  = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name',
            'sender_role', 'sender_initials',
            'recipient', 'content', 'is_read', 'read_at',
            'attachment', 'created_at',
        ]
        read_only_fields = ['id', 'sender', 'is_read', 'read_at', 'created_at']


class SendMessageSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField()
    content         = serializers.CharField(min_length=1, max_length=5000)
    attachment      = serializers.FileField(required=False)


class ConversationSerializer(serializers.ModelSerializer):
    participants_data = serializers.SerializerMethodField()
    last_message_data = serializers.SerializerMethodField()
    unread_count      = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = [
            'id', 'title', 'case', 'participants_data',
            'last_message_data', 'unread_count', 'created_at', 'updated_at',
        ]

    def get_participants_data(self, obj):
        return [
            {'id': p.id, 'full_name': p.full_name,
             'role': p.role, 'initials': p.initials}
            for p in obj.participants.all()
        ]

    def get_last_message_data(self, obj):
        msg = obj.last_message
        if not msg:
            return None
        return {
            'content':    msg.content[:80],
            'sender':     msg.sender.full_name if msg.sender else '',
            'created_at': msg.created_at,
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.unread_count_for(request.user)
        return 0


class StartConversationSerializer(serializers.Serializer):
    recipient_id    = serializers.IntegerField()
    case_id         = serializers.IntegerField(required=False, allow_null=True)
    initial_message = serializers.CharField(min_length=1)