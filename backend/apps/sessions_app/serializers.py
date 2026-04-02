from rest_framework import serializers
from .models import CounselingSession


class SessionUserSerializer(serializers.Serializer):
    id        = serializers.IntegerField()
    full_name = serializers.CharField()
    email     = serializers.EmailField()
    role      = serializers.CharField()


class SessionSerializer(serializers.ModelSerializer):
    student   = SessionUserSerializer(read_only=True)
    counselor = SessionUserSerializer(read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True, default=None)

    class Meta:
        model  = CounselingSession
        fields = [
            'id', 'student', 'counselor', 'case', 'case_number',
            'title', 'notes', 'scheduled_at', 'duration_mins',
            'status', 'location', 'meeting_link',
            'google_event_id', 'created_at', 'updated_at',
        ]


class CreateSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CounselingSession
        fields = ['counselor', 'case', 'title', 'scheduled_at',
                  'duration_mins', 'location', 'notes']
