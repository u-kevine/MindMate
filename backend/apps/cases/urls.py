from django.urls import path
from . import views

urlpatterns = [
    path('',              views.CaseListCreateView.as_view(), name='case-list'),
    path('<int:pk>/',     views.CaseDetailView.as_view(),     name='case-detail'),
    path('<int:pk>/update/', views.UpdateCaseView.as_view(),  name='case-update'),
    path('<int:pk>/notes/',  views.AddNoteView.as_view(),     name='case-add-note'),
    path('stats/',           views.case_stats,                name='case-stats'),
]