"""
Support Cases Models
Tracks student mental health support requests end-to-end.
"""
from django.db import models
from django.conf import settings


class SupportCase(models.Model):
    class Status(models.TextChoices):
        OPEN        = 'open',        'Ouvert'
        IN_PROGRESS = 'in_progress', 'En cours'
        RESOLVED    = 'resolved',    'Résolu'
        CLOSED      = 'closed',      'Fermé'

    class Priority(models.TextChoices):
        LOW    = 'low',    'Faible'
        MEDIUM = 'medium', 'Moyenne'
        HIGH   = 'high',   'Élevée'
        URGENT = 'urgent', 'Urgente'

    class CaseType(models.TextChoices):
        ACADEMIC    = 'academic',    'Stress Académique'
        ANXIETY     = 'anxiety',     'Anxiété'
        GRIEF       = 'grief',       'Deuil & Perte'
        RELATIONSHIP = 'relationship', 'Relations'
        DEPRESSION  = 'depression',  'Dépression'
        TRAUMA      = 'trauma',      'Trauma'
        OTHER       = 'other',       'Autre'

    # Parties
    student    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='student_cases', limit_choices_to={'role': 'student'}
    )
    counselor  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_cases',
        limit_choices_to={'role': 'counselor'}
    )

    # Case details
    case_number   = models.CharField(max_length=20, unique=True, blank=True)
    case_type     = models.CharField(max_length=30, choices=CaseType.choices, default=CaseType.ACADEMIC)
    priority      = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status        = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    title         = models.CharField(max_length=300)
    description   = models.TextField()
    is_urgent     = models.BooleanField(default=False)
    is_anonymous  = models.BooleanField(default=False)

    # Timestamps
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
    resolved_at   = models.DateTimeField(null=True, blank=True)

    # Appointment
    next_session_at = models.DateTimeField(null=True, blank=True)
    session_location = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table   = 'mm_support_cases'
        verbose_name = 'Dossier de soutien'
        verbose_name_plural = 'Dossiers de soutien'
        ordering   = ['-created_at']
        indexes    = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['counselor', 'status']),
            models.Index(fields=['status', 'priority']),
        ]

    def __str__(self):
        return f'{self.case_number} — {self.title[:60]}'

    def save(self, *args, **kwargs):
        if not self.case_number:
            last = SupportCase.objects.order_by('-id').first()
            next_id = (last.id + 1) if last else 1
            self.case_number = f'C-{next_id:04d}'
        super().save(*args, **kwargs)

    @property
    def progress_percent(self):
        weights = {'open': 10, 'in_progress': 55, 'resolved': 100, 'closed': 100}
        return weights.get(self.status, 0)


class CaseNote(models.Model):
    """Counselor notes attached to a case."""
    case       = models.ForeignKey(SupportCase, on_delete=models.CASCADE, related_name='notes')
    author     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    content    = models.TextField()
    is_private = models.BooleanField(default=False, help_text='Private notes not visible to students')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mm_case_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f'Note on {self.case.case_number} by {self.author}'


class CaseActivity(models.Model):
    """Audit trail of case status changes and actions."""
    class ActivityType(models.TextChoices):
        STATUS_CHANGE   = 'status_change',   'Changement de statut'
        COUNSELOR_ASSIGN = 'counselor_assign', 'Assignation conseiller'
        NOTE_ADDED      = 'note_added',       'Note ajoutée'
        SESSION_SCHEDULED = 'session_scheduled', 'Séance planifiée'
        MESSAGE_SENT    = 'message_sent',     'Message envoyé'

    case          = models.ForeignKey(SupportCase, on_delete=models.CASCADE, related_name='activities')
    actor         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    activity_type = models.CharField(max_length=30, choices=ActivityType.choices)
    description   = models.TextField()
    old_value     = models.CharField(max_length=100, blank=True)
    new_value     = models.CharField(max_length=100, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mm_case_activities'
        ordering = ['-created_at']