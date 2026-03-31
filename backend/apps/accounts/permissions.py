"""Custom DRF permissions for MindMate."""
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsCounselorUser(BasePermission):
    """Allow access only to counselors."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'counselor')


class IsStudentUser(BasePermission):
    """Allow access only to students."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'student')


class IsAdminOrCounselor(BasePermission):
    """Allow access to admins or counselors."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('admin', 'counselor')
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: allow if owner or admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        # obj could be a User instance or have a 'user' FK
        owner = obj if hasattr(obj, 'email') else getattr(obj, 'user', None)
        return owner == request.user


class IsRelatedToCase(BasePermission):
    """Allow if user is the student, assigned counselor, or admin."""
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'admin':
            return True
        if user.role == 'student':
            return obj.student == user
        if user.role == 'counselor':
            return obj.counselor == user
        return False