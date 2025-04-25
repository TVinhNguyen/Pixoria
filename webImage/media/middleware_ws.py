from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from django.conf import settings
from django.contrib.auth.models import User
from urllib.parse import parse_qs


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware xác thực JWT cho WebSocket.
    Lấy token từ query string và xác thực người dùng.
    """
    
    async def __call__(self, scope, receive, send):
        # Thêm thông tin user vào scope
        scope['user'] = await self.get_user(scope)
        
        # Chuyển tiếp đến consumer
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user(self, scope):
        # Mặc định là user anonymous
        user = AnonymousUser()
        
        # Lấy token từ query string
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [''])[0]
        
        # Nếu không có token trong query string, thử lấy từ headers
        if not token:
            headers = dict(scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode('utf-8')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return user
        
        try:
            # Xác thực token
            jwt_object = JWTAuthentication()
            validated_token = jwt_object.get_validated_token(token)
            user = jwt_object.get_user(validated_token)
            return user
        except (InvalidToken, TokenError, jwt.PyJWTError) as e:
            print(f"Invalid token: {e}")
            return user
        except Exception as e:
            print(f"Authentication error: {e}")
            return user


def JWTAuthMiddlewareStack(inner):
    """Áp dụng middleware xác thực JWT cho WebSocket"""
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))