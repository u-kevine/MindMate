"""
Messages Models — secure in-app messaging between students and counselors.
"""
from django.db import models
from django.conf import settings


class Conversation(models.Model):
    """A thread between a student and a counselor, optionally tied to a case."""
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='conversations'
    )
    case = models.ForeignKey(
        'cases.SupportCase', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='conversations'
    )
    title      = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mm_conversations'
        ordering = ['-updated_at']

    def __str__(self):
        names = ', '.join(p.full_name for p in self.participants.all()[:3])
        return f'Conversation: {names}'

    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()

    def unread_count_for(self, user):
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='received_messages'
    )
    content    = models.TextField()
    is_read    = models.BooleanField(default=False)
    read_at    = models.DateTimeField(null=True, blank=True)
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mm_messages'
        ordering = ['created_at']
        indexes  = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f'{self.sender} → {self.recipient}: {self.content[:50]}'