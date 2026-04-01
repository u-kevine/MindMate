import os
import logging
from celery import Celery

logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mindmate_project.settings')

app = Celery('mindmate')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@app.task(bind=True, max_retries=3, default_retry_delay=60,
          name='mindmate_project.celery.notify_new_case')
def notify_new_case(self, case_id):
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from apps.cases.models import SupportCase
        from django.contrib.auth import get_user_model

        User = get_user_model()
        case = SupportCase.objects.select_related('student', 'counselor').get(pk=case_id)
        student = case.student

        send_mail(
            subject='[MindMate] Request received — ' + case.case_number,
            message=(
                'Hello ' + student.first_name + ',\n\n'
                'Your support request has been received.\n\n'
                'Reference: ' + case.case_number + '\n'
                'Type: ' + case.get_case_type_display() + '\n'
                'Priority: ' + case.get_priority_display() + '\n\n'
                'A counselor will contact you within 24 hours.\n\n'
                '— The MindMate Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student.email],
            fail_silently=True,
        )

        if case.counselor:
            counselor_emails = [case.counselor.email]
        else:
            counselor_emails = list(
                User.objects.filter(role='counselor', is_active=True)
                .values_list('email', flat=True)
            )

        if counselor_emails:
            send_mail(
                subject='[MindMate] New case — ' + case.case_number,
                message=(
                    'A new support request has been submitted.\n\n'
                    'Reference: ' + case.case_number + '\n'
                    'Student: ' + student.full_name + '\n'
                    'Type: ' + case.get_case_type_display() + '\n'
                    'Priority: ' + case.get_priority_display() + '\n\n'
                    'Log in to MindMate to manage this case.\n\n'
                    '— MindMate System'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=counselor_emails,
                fail_silently=True,
            )

        logger.info('notify_new_case: emails sent for case %s', case.case_number)

    except Exception as exc:
        logger.error('notify_new_case failed for case_id=%s: %s', case_id, exc)
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=3, default_retry_delay=60,
          name='mindmate_project.celery.notify_counselor_assigned')
def notify_counselor_assigned(self, case_id, counselor_id):
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from apps.cases.models import SupportCase
        from django.contrib.auth import get_user_model

        User = get_user_model()
        case = SupportCase.objects.select_related('student', 'counselor').get(pk=case_id)
        counselor = User.objects.get(pk=counselor_id)
        student = case.student

        send_mail(
            subject='[MindMate] Counselor assigned — ' + case.case_number,
            message=(
                'Hello ' + student.first_name + ',\n\n'
                'A counselor has been assigned to your case ' + case.case_number + '.\n\n'
                'Your counselor: ' + counselor.full_name + '\n\n'
                'You can now send them a message via MindMate.\n\n'
                '— The MindMate Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student.email],
            fail_silently=True,
        )

        send_mail(
            subject='[MindMate] Case assigned — ' + case.case_number,
            message=(
                'Hello ' + counselor.first_name + ',\n\n'
                'Case ' + case.case_number + ' has been assigned to you.\n\n'
                'Student: ' + student.full_name + '\n'
                'Type: ' + case.get_case_type_display() + '\n'
                'Priority: ' + case.get_priority_display() + '\n\n'
                'Log in to MindMate to view the full case.\n\n'
                '— MindMate System'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[counselor.email],
            fail_silently=True,
        )

        logger.info('notify_counselor_assigned: case=%s', case.case_number)

    except Exception as exc:
        logger.error('notify_counselor_assigned failed: %s', exc)
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=3, default_retry_delay=60,
          name='mindmate_project.celery.notify_case_status_changed')
def notify_case_status_changed(self, case_id, old_status, new_status):
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from apps.cases.models import SupportCase

        case = SupportCase.objects.select_related('student', 'counselor').get(pk=case_id)
        student = case.student

        STATUS_LABELS = {
            'open': 'Open',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'closed': 'Closed',
        }

        if new_status == 'resolved':
            subject = '[MindMate] Case resolved — ' + case.case_number
            body = (
                'Hello ' + student.first_name + ',\n\n'
                'Your case ' + case.case_number + ' has been resolved.\n\n'
                'We hope the support was helpful.\n\n'
                '— The MindMate Team'
            )
        else:
            subject = '[MindMate] Case updated — ' + case.case_number
            body = (
                'Hello ' + student.first_name + ',\n\n'
                'Your case ' + case.case_number + ' has been updated.\n\n'
                'Previous status: ' + STATUS_LABELS.get(old_status, old_status) + '\n'
                'New status: ' + STATUS_LABELS.get(new_status, new_status) + '\n\n'
                'Log in to MindMate to view the details.\n\n'
                '— The MindMate Team'
            )

        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student.email],
            fail_silently=True,
        )

        logger.info('notify_case_status_changed: case=%s', case.case_number)

    except Exception as exc:
        logger.error('notify_case_status_changed failed: %s', exc)
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=3, default_retry_delay=30,
          name='mindmate_project.celery.notify_new_message')
def notify_new_message(self, message_id):
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from django.utils import timezone
        from datetime import timedelta
        from apps.messages_app.models import Message

        msg = Message.objects.select_related(
            'sender', 'recipient', 'conversation'
        ).get(pk=message_id)

        recipient = msg.recipient
        sender = msg.sender

        if not recipient or not sender:
            return

        if recipient.last_login:
            diff = timezone.now() - recipient.last_login
            if diff < timedelta(minutes=5):
                return

        unread = Message.objects.filter(
            conversation=msg.conversation,
            recipient=recipient,
            is_read=False
        ).count()

        send_mail(
            subject='[MindMate] New message from ' + sender.full_name,
            message=(
                'Hello ' + recipient.first_name + ',\n\n'
                'You have a new message from ' + sender.full_name + '.\n\n'
                '"' + msg.content[:150] + '"\n\n'
                'You have ' + str(unread) + ' unread message(s).\n\n'
                'Log in to MindMate to reply.\n\n'
                '— The MindMate Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            fail_silently=True,
        )

        logger.info('notify_new_message: sent to %s', recipient.email)

    except Exception as exc:
        logger.error('notify_new_message failed: %s', exc)
        raise self.retry(exc=exc)


@app.task(bind=True, max_retries=3, default_retry_delay=60,
          name='mindmate_project.celery.notify_session_scheduled')
def notify_session_scheduled(self, case_id):
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        from apps.cases.models import SupportCase

        case = SupportCase.objects.select_related('student', 'counselor').get(pk=case_id)

        if not case.counselor or not case.next_session_at:
            return

        student = case.student
        counselor = case.counselor
        session_dt = case.next_session_at.strftime('%A %d %B %Y at %H:%M')
        location = case.session_location or 'Counseling Center'

        for recipient, other in [(student, counselor), (counselor, student)]:
            send_mail(
                subject='[MindMate] Session scheduled — ' + case.case_number,
                message=(
                    'Hello ' + recipient.first_name + ',\n\n'
                    'A counseling session has been scheduled.\n\n'
                    'Date & Time: ' + session_dt + '\n'
                    'Location: ' + location + '\n'
                    'With: ' + other.full_name + '\n\n'
                    'Log in to MindMate to confirm.\n\n'
                    '— The MindMate Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=True,
            )

        logger.info('notify_session_scheduled: case=%s', case.case_number)

    except Exception as exc:
        logger.error('notify_session_scheduled failed: %s', exc)
        raise self.retry(exc=exc)


@app.task(bind=True, name='mindmate_project.celery.cleanup_expired_tokens')
def cleanup_expired_tokens(self):
    try:
        from django.utils import timezone
        from apps.accounts.models import PasswordResetToken

        deleted, _ = PasswordResetToken.objects.filter(
            expires_at__lte=timezone.now()
        ).delete()
        used, _ = PasswordResetToken.objects.filter(used=True).delete()

        jwt_deleted = 0
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            expired = OutstandingToken.objects.filter(expires_at__lte=timezone.now())
            jwt_deleted = expired.count()
            expired.delete()
        except ImportError:
            pass

        logger.info('cleanup_expired_tokens: removed %d tokens', deleted + used + jwt_deleted)
        return {'deleted': deleted + used + jwt_deleted}

    except Exception as exc:
        logger.error('cleanup_expired_tokens failed: %s', exc)
        raise


@app.task(bind=True, ignore_result=True,
          name='mindmate_project.celery.debug_task')
def debug_task(self):
    logger.info('MindMate Celery worker alive. Request: %r', self.request)
    print('[MindMate] Celery debug task running.')