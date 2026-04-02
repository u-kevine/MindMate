from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import CounselingSession
from .serializers import SessionSerializer, CreateSessionSerializer


class SessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return CreateSessionSerializer if self.request.method == 'POST' else SessionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = CounselingSession.objects.all()
        elif user.role == 'counselor':
            qs = CounselingSession.objects.filter(counselor=user)
        else:
            qs = CounselingSession.objects.filter(student=user)

        status_filter = self.request.query_params.get('status')
        upcoming = self.request.query_params.get('upcoming')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if upcoming == 'true':
            qs = qs.filter(scheduled_at__gte=timezone.now())
        return qs.select_related('student', 'counselor', 'case').order_by('scheduled_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'student':
            session = serializer.save(student=user, status='pending')
        else:
            session = serializer.save(status='pending')

        # Send confirmation email
        try:
            from apps.core.email_service import send_session_booked
            send_session_booked(session)
        except Exception as e:
            print(f'[EMAIL] session booked email failed: {e}')

        # Try Google Calendar
        try:
            from apps.core.calendar_service import create_calendar_event
            result = create_calendar_event(session)
            if result:
                session.google_event_id = result.get('event_id', '')
                if result.get('meet_link'):
                    session.meeting_link = result['meet_link']
                session.save(update_fields=['google_event_id', 'meeting_link'])
        except Exception as e:
            print(f'[CALENDAR] failed: {e}')


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_session_status(request, pk):
    try:
        session = CounselingSession.objects.get(pk=pk)
    except CounselingSession.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    # Check permission
    user = request.user
    if user.role not in ['admin', 'counselor'] and session.student != user:
        return Response({'error': 'Permission denied'}, status=403)

    new_status = request.data.get('status')
    if new_status not in ['confirmed', 'cancelled', 'completed']:
        return Response({'error': 'Invalid status. Use: confirmed, cancelled, completed'}, status=400)

    old_status = session.status
    session.status = new_status

    if request.data.get('location'):
        session.location = request.data['location']
    if request.data.get('meeting_link'):
        session.meeting_link = request.data['meeting_link']
    if request.data.get('notes'):
        session.notes = request.data['notes']
    session.save()

    # Send emails based on status change
    try:
        from apps.core.email_service import send_session_booked, send_session_cancelled
        if new_status == 'confirmed' and old_status == 'pending':
            send_session_booked(session)
            try:
                from apps.core.calendar_service import create_calendar_event
                result = create_calendar_event(session)
                if result:
                    session.google_event_id = result.get('event_id', '')
                    if result.get('meet_link'):
                        session.meeting_link = result['meet_link']
                    session.save(update_fields=['google_event_id', 'meeting_link'])
            except Exception as e:
                print(f'[CALENDAR] {e}')
        elif new_status == 'cancelled':
            send_session_cancelled(session, cancelled_by=user)
            try:
                from apps.core.calendar_service import cancel_calendar_event
                cancel_calendar_event(session.google_event_id)
            except Exception as e:
                print(f'[CALENDAR CANCEL] {e}')
    except Exception as e:
        print(f'[EMAIL] {e}')

    return Response(SessionSerializer(session).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_slots(request):
    counselor_id = request.query_params.get('counselor_id')
    if not counselor_id:
        return Response({'error': 'counselor_id required'}, status=400)

    from apps.accounts.models import User
    try:
        counselor = User.objects.get(id=counselor_id, role='counselor')
    except User.DoesNotExist:
        return Response({'error': 'Counselor not found'}, status=404)

    now = timezone.now()
    end = now + timedelta(days=14)

    booked = CounselingSession.objects.filter(
        counselor=counselor,
        scheduled_at__range=(now, end),
        status__in=['pending', 'confirmed']
    ).values_list('scheduled_at', flat=True)

    booked_keys = set(dt.strftime('%Y-%m-%dT%H:00') for dt in booked)

    slots = []
    current = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    while current <= end and len(slots) < 40:
        if current.weekday() < 5 and 9 <= current.hour < 17:
            key = current.strftime('%Y-%m-%dT%H:00')
            if key not in booked_keys:
                slots.append({
                    'datetime': current.isoformat(),
                    'label': current.strftime('%a %b %d — %I:%M %p'),
                })
        current += timedelta(hours=1)

    return Response({
        'slots': slots,
        'counselor': counselor.full_name,
        'counselor_id': counselor.id,
    })
