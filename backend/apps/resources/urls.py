from django.urls import path
from . import views

urlpatterns = [
    path('categories/',  views.ResourceCategoryListView.as_view(),   name='resource-categories'),
    path('',             views.ResourceListCreateView.as_view(),      name='resource-list'),
    path('<int:pk>/',    views.ResourceDetailView.as_view(),          name='resource-detail'),
]