from rest_framework import serializers
from .models import CounselingSession
from apps.accounts.serializers import UserSerializer


class SessionSerializer(serializers.ModelSerializer):
    student  = UserSerializer(read_only=True)
    counselor = UserSerializer(read_only=True)

    class Meta:
        model = CounselingSession
        fields = '__all__'


class CreateSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CounselingSession
        fields = ['counselor', 'case', 'title', 'scheduled_at', 'duration_mins', 'location', 'notes']
