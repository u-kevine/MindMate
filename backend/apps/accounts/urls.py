"""Accounts URL patterns."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .google_auth import GoogleTokenLoginView

urlpatterns = [
    # Auth
    path('login/',         views.LoginView.as_view(),         name='auth-login'),
    path('logout/',        views.LogoutView.as_view(),        name='auth-logout'),
    path('register/',      views.RegisterView.as_view(),      name='auth-register'),
    path('token/refresh/', TokenRefreshView.as_view(),        name='token-refresh'),
    path('google/token/',  GoogleTokenLoginView.as_view(),    name='google-token-login'),

    # Profile
    path('me/',             views.MeView.as_view(),             name='auth-me'),
    path('me/password/',    views.ChangePasswordView.as_view(), name='auth-change-password'),
    path('me/preferences/', views.UpdatePreferencesView.as_view(), name='auth-preferences'),

    # Admin user management
    path('users/',          views.UserListView.as_view(),    name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # Helpers
    path('counselors/',      views.CounselorListView.as_view(), name='counselor-list'),
    path('dashboard/stats/', views.dashboard_stats,             name='dashboard-stats'),
]
