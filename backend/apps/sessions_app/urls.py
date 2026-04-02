from django.urls import path
from . import views

urlpatterns = [
    path('',                     views.SessionListCreateView.as_view(), name='session-list'),
    path('<int:pk>/status/',     views.update_session_status,           name='session-status'),
    path('available-slots/',     views.available_slots,                 name='available-slots'),
]
EOF

cat > /workspaces/MindMate/backend/apps/sessions_app/__init__.py << 'EOF'
EOF

cat > /workspaces/MindMate/backend/apps/sessions_app/apps.py << 'EOF'
from django.apps import AppConfig

class SessionsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sessions_app'
    label = 'sessions_app'
    verbose_name = 'Counseling Sessions'
