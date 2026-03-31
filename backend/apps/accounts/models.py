"""
Accounts Models — Custom User for MindMate
Roles: student | counselor | admin
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        STUDENT   = 'student',   'Étudiant'
        COUNSELOR = 'counselor', 'Conseiller'
        ADMIN     = 'admin',     'Administrateur'

    # Core fields
    email      = models.EmailField(unique=True, verbose_name='Adresse email')
    first_name = models.CharField(max_length=100, verbose_name='Prénom')
    last_name  = models.CharField(max_length=100, verbose_name='Nom')
    role       = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone      = models.CharField(max_length=20, blank=True)
    bio        = models.TextField(blank=True)

    # Status
    is_active    = models.BooleanField(default=True)
    is_staff     = models.BooleanField(default=False)
    is_verified  = models.BooleanField(default=False)
    date_joined  = models.DateTimeField(default=timezone.now)
    last_login   = models.DateTimeField(null=True, blank=True)

    # Preferences
    language     = models.CharField(max_length=5, default='fr')
    theme        = models.CharField(max_length=10, default='light')
    notifications_enabled = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table   = 'mm_users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.full_name} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def initials(self):
        parts = self.full_name.split()
        return ''.join(p[0].upper() for p in parts[:2]) if parts else 'MM'

    def is_student(self):   return self.role == self.Role.STUDENT
    def is_counselor(self): return self.role == self.Role.COUNSELOR
    def is_admin(self):     return self.role == self.Role.ADMIN


class StudentProfile(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=50, unique=True, verbose_name='Numéro étudiant')
    department = models.CharField(max_length=200, blank=True)
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    emergency_contact_name  = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mm_student_profiles'
        verbose_name = 'Profil étudiant'

    def __str__(self):
        return f'{self.user.full_name} — {self.student_id}'


class CounselorProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='counselor_profile')
    license_number = models.CharField(max_length=100, blank=True)
    specialty   = models.CharField(max_length=200, blank=True)
    is_available = models.BooleanField(default=True)
    max_cases   = models.PositiveSmallIntegerField(default=10)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mm_counselor_profiles'
        verbose_name = 'Profil conseiller'

    def __str__(self):
        return f'{self.user.full_name} — {self.specialty}'

    @property
    def active_case_count(self):
        return self.user.assigned_cases.filter(
            status__in=['open', 'in_progress']
        ).count()


class PasswordResetToken(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    token      = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used       = models.BooleanField(default=False)

    class Meta:
        db_table = 'mm_password_reset_tokens'