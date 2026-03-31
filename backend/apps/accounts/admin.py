from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, CounselorProfile, PasswordResetToken


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    extra = 0


class CounselorProfileInline(admin.StackedInline):
    model = CounselorProfile
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'full_name', 'role', 'is_active', 'is_verified', 'date_joined']
    list_filter   = ['role', 'is_active', 'is_verified']
    search_fields = ['email', 'first_name', 'last_name']
    ordering      = ['-date_joined']
    inlines       = [StudentProfileInline, CounselorProfileInline]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'phone', 'bio', 'avatar')}),
        ('Rôle & Statut', {'fields': ('role', 'is_active', 'is_verified', 'is_staff', 'is_superuser')}),
        ('Préférences', {'fields': ('language', 'theme', 'notifications_enabled')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'student_id', 'department', 'year_of_study']
    search_fields = ['user__email', 'student_id']


@admin.register(CounselorProfile)
class CounselorProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'specialty', 'is_available', 'max_cases']
    list_filter   = ['is_available']
    search_fields = ['user__email', 'specialty']