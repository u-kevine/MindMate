"""MindMate URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('auth/',      include('apps.accounts.urls')),
        path('cases/',     include('apps.cases.urls')),
        path('messages/',  include('apps.messages_app.urls')),
        path('resources/', include('apps.resources.urls')),
        path('sessions/',  include('apps.sessions_app.urls')),
    ])),
    path('api/schema/', SpectacularAPIView.as_view(),                    name='schema'),
    path('api/docs/',   SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,  document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
