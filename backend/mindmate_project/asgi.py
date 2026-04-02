import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mindmate_project.settings')

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()  # This must come FIRST before any other imports

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.messages_app.routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(apps.messages_app.routing.websocket_urlpatterns)
    ),
})
