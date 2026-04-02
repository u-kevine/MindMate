"""Messages Views"""
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.email_service import send_new_message_notification
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, MessageSerializer,
    SendMessageSerializer, StartConversationSerializer,
)

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    """List conversations for the authenticated user."""
    serializer_class   = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages').order_by('-updated_at')


class StartConversationView(APIView):
    """Start a new conversation or return existing one."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            recipient = User.objects.get(pk=data['recipient_id'])
        except User.DoesNotExist:
            return Response({'detail': 'Destinataire introuvable.'}, status=404)

        # Check if a conversation already exists between these two users
        existing = Conversation.objects.filter(
            participants=request.user
        ).filter(participants=recipient)
        if data.get('case_id'):
            existing = existing.filter(case_id=data['case_id'])

        if existing.exists():
            conv = existing.first()
        else:
            conv = Conversation.objects.create(
                case_id=data.get('case_id'),
                title=f'{request.user.full_name} & {recipient.full_name}',
            )
            conv.participants.add(request.user, recipient)

        # Send the initial message
        Message.objects.create(
            conversation=conv,
            sender=request.user,
            recipient=recipient,
            content=data['initial_message'],
        )
        conv.save()  # updates updated_at

        return Response(
            ConversationSerializer(conv, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MessageListView(generics.ListAPIView):
    """List messages in a conversation and mark them as read."""
    serializer_class   = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conv_id = self.kwargs['conversation_id']
        # Ensure user is a participant
        conv = Conversation.objects.filter(
            pk=conv_id, participants=self.request.user
        ).first()
        if not conv:
            return Message.objects.none()

        # Mark unread messages as read
        Message.objects.filter(
            conversation=conv,
            recipient=self.request.user,
            is_read=False,
        ).update(is_read=True, read_at=timezone.now())

        return Message.objects.filter(conversation=conv).select_related('sender', 'recipient')


class SendMessageView(APIView):
    """Send a message in an existing conversation."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            conv = Conversation.objects.get(
                pk=data['conversation_id'], participants=request.user
            )
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation introuvable.'}, status=404)

        # Determine recipient (the other participant)
        recipient = conv.participants.exclude(pk=request.user.pk).first()

        msg = Message.objects.create(
            conversation=conv,
            sender=request.user,
            recipient=recipient,
            content=data['content'],
            attachment=data.get('attachment'),
        )
        conv.save()  # updates updated_at

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class UnreadCountView(APIView):
    """Total unread messages for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})