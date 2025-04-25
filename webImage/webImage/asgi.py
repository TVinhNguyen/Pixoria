"""
ASGI config for webImage project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""
# webImage/webImage/asgi.py
import os
import django

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webImage.settings')

# Initialize Django BEFORE importing modules that use Django models
django.setup()

# Import AFTER Django is initialized
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from media.middleware_ws import JWTAuthMiddlewareStack
import media.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            media.routing.websocket_urlpatterns
        )
    ),
})