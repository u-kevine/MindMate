from django.urls import path
from . import views

urlpatterns = [
    path('conversations/',            views.ConversationListView.as_view(),  name='conv-list'),
    path('conversations/start/',      views.StartConversationView.as_view(), name='conv-start'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='msg-list'),
    path('send/',                     views.SendMessageView.as_view(),       name='msg-send'),
    path('unread/',                   views.UnreadCountView.as_view(),       name='msg-unread'),
]