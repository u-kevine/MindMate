"""Cases Serializers"""
from django.utils import timezone
from rest_framework import serializers
from .models import SupportCase, CaseNote, CaseActivity
from apps.accounts.serializers import UserListSerializer


class CaseNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.full_name')

    class Meta:
        model  = CaseNote
        fields = ['id', 'content', 'is_private', 'author_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author_name', 'created_at', 'updated_at']


class CaseActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source='actor.full_name')

    class Meta:
        model  = CaseActivity
        fields = ['id', 'activity_type', 'description', 'old_value', 'new_value',
                  'actor_name', 'created_at']


class SupportCaseSerializer(serializers.ModelSerializer):
    student_name   = serializers.ReadOnlyField(source='student.full_name')
    student_email  = serializers.ReadOnlyField(source='student.email')
    counselor_name = serializers.ReadOnlyField(source='counselor.full_name')
    progress_percent = serializers.ReadOnlyField()
    notes          = serializers.SerializerMethodField()
    activities     = CaseActivitySerializer(many=True, read_only=True)

    class Meta:
        model  = SupportCase
        fields = [
            'id', 'case_number', 'case_type', 'priority', 'status',
            'title', 'description', 'is_urgent', 'is_anonymous',
            'student', 'student_name', 'student_email',
            'counselor', 'counselor_name',
            'progress_percent', 'notes', 'activities',
            'next_session_at', 'session_location',
            'created_at', 'updated_at', 'resolved_at',
        ]
        read_only_fields = [
            'id', 'case_number', 'student', 'progress_percent',
            'created_at', 'updated_at', 'resolved_at',
        ]

    def get_notes(self, obj):
        request = self.context.get('request')
        qs = obj.notes.all()
        # Students can only see non-private notes
        if request and request.user.role == 'student':
            qs = qs.filter(is_private=False)
        return CaseNoteSerializer(qs, many=True).data


class SupportCaseListSerializer(serializers.ModelSerializer):
    """Lightweight for list views."""
    student_name   = serializers.ReadOnlyField(source='student.full_name')
    counselor_name = serializers.ReadOnlyField(source='counselor.full_name')
    progress_percent = serializers.ReadOnlyField()

    class Meta:
        model  = SupportCase
        fields = [
            'id', 'case_number', 'case_type', 'priority', 'status',
            'title', 'student_name', 'counselor_name',
            'progress_percent', 'is_urgent', 'created_at', 'updated_at',
        ]


class CreateCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SupportCase
        fields = [
            'case_type', 'priority', 'title', 'description',
            'is_urgent', 'is_anonymous', 'counselor',
        ]

    def validate_counselor(self, value):
        if value and value.role != 'counselor':
            raise serializers.ValidationError('Selected user is not a counselor.')
        return value

    def create(self, validated_data):
        request = self.context['request']
        validated_data['student'] = request.user
        case = SupportCase.objects.create(**validated_data)
        CaseActivity.objects.create(
            case=case,
            actor=request.user,
            activity_type=CaseActivity.ActivityType.STATUS_CHANGE,
            description=f'Dossier créé par {request.user.full_name}',
            old_value='',
            new_value='open',
        )
        return case


class UpdateCaseStatusSerializer(serializers.Serializer):
    status   = serializers.ChoiceField(choices=SupportCase.Status.choices)
    priority = serializers.ChoiceField(choices=SupportCase.Priority.choices, required=False)
    counselor = serializers.PrimaryKeyRelatedField(
        queryset=__import__('apps.accounts.models', fromlist=['User']).User.objects.filter(role='counselor'),
        required=False, allow_null=True
    )
    next_session_at  = serializers.DateTimeField(required=False, allow_null=True)
    session_location = serializers.CharField(required=False, allow_blank=True)


class AddCaseNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CaseNote
        fields = ['content', 'is_private']