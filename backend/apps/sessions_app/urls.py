from django.urls import path
from . import views

urlpatterns = [
    path('',                    views.SessionListCreateView.as_view(), name='session-list'),
    path('<int:pk>/status/',    views.update_session_status,           name='session-status-update'),
    path('available-slots/',    views.available_slots,                 name='session-available-slots'),
]
