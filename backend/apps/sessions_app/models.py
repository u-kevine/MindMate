from django.db import models
from django.conf import settings

class CounselingSession(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    student        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_sessions')
    counselor      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='counselor_sessions')
    case           = models.ForeignKey('cases.SupportCase', on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    title          = models.CharField(max_length=200, default='Counseling Session')
    notes          = models.TextField(blank=True)
    scheduled_at   = models.DateTimeField()
    duration_mins  = models.IntegerField(default=60)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    location       = models.CharField(max_length=200, blank=True, default='Online / Room TBD')
    meeting_link   = models.URLField(blank=True)
    google_event_id = models.CharField(max_length=200, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mm_sessions'
        ordering = ['scheduled_at']

    def __str__(self):
        return f"{self.student} ↔ {self.counselor} @ {self.scheduled_at}"
