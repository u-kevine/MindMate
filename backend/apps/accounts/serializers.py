"""Accounts Serializers"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, StudentProfile, CounselorProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT login — returns tokens + user data."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email']     = user.email
        token['full_name'] = user.full_name
        token['role']      = user.role
        token['initials']  = user.initials
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id':        user.id,
            'email':     user.email,
            'full_name': user.full_name,
            'role':      user.role,
            'initials':  user.initials,
            'avatar':    user.avatar.url if user.avatar else None,
            'language':  user.language,
            'theme':     user.theme,
        }
        return data


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StudentProfile
        fields = ['student_id', 'department', 'year_of_study',
                  'emergency_contact_name', 'emergency_contact_phone']


class CounselorProfileSerializer(serializers.ModelSerializer):
    active_case_count = serializers.ReadOnlyField()

    class Meta:
        model  = CounselorProfile
        fields = ['license_number', 'specialty', 'is_available',
                  'max_cases', 'active_case_count']


class UserSerializer(serializers.ModelSerializer):
    student_profile   = StudentProfileSerializer(read_only=True)
    counselor_profile = CounselorProfileSerializer(read_only=True)
    full_name         = serializers.ReadOnlyField()
    initials          = serializers.ReadOnlyField()
    avatar_url        = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'initials', 'role', 'phone', 'bio', 'avatar', 'avatar_url',
            'is_verified', 'language', 'theme', 'notifications_enabled',
            'date_joined', 'last_login',
            'student_profile', 'counselor_profile',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_verified', 'role']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for lists."""
    full_name = serializers.ReadOnlyField()
    initials  = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ['id', 'email', 'full_name', 'initials', 'role', 'is_active', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')
    student_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password2',
                  'role', 'phone', 'student_id']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if attrs.get('role') == User.Role.ADMIN:
            raise serializers.ValidationError({'role': 'Cannot self-register as admin.'})
        return attrs

    def create(self, validated_data):
        student_id = validated_data.pop('student_id', None)
        user = User.objects.create_user(**validated_data)
        if user.role == User.Role.STUDENT and student_id:
            StudentProfile.objects.create(user=user, student_id=student_id)
        elif user.role == User.Role.COUNSELOR:
            CounselorProfile.objects.create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class UpdatePreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['language', 'theme', 'notifications_enabled']