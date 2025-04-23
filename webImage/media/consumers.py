import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
import redis.asyncio as aioredis
from django.conf import settings


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer cho việc nhận thông báo realtime.
    Lắng nghe kênh Redis của người dùng và gửi thông báo qua WebSocket khi có thông báo mới
    """
    async def connect(self):
        # Lấy thông tin user từ scope (đã được xác thực bởi middleware)
        self.user = self.scope["user"]
        
        # Không cho phép kết nối nếu user chưa đăng nhập
        if not self.user.is_authenticated:
            await self.close()
            return

        # Lấy ID user profile để tạo tên nhóm
        self.profile_id = await self.get_user_profile_id(self.user)
        if not self.profile_id:
            await self.close()
            return
            
        self.notification_group_name = f"user_{self.profile_id}_notifications"
        
        # Tham gia nhóm kênh
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        # Chấp nhận kết nối WebSocket
        await self.accept()
        
        # Bắt đầu lắng nghe Redis trong một task riêng biệt
        self.redis_task = asyncio.create_task(self.listen_to_redis())
    
    async def disconnect(self, close_code):
        # Hủy task lắng nghe Redis nếu đang chạy
        if hasattr(self, 'redis_task') and not self.redis_task.done():
            self.redis_task.cancel()
            
        # Rời khỏi nhóm kênh
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    @database_sync_to_async
    def get_user_profile_id(self, user):
        """Lấy ID của UserProfile từ User, thực hiện bất đồng bộ để tránh chặn event loop"""
        try:
            return user.userprofile.id
        except Exception as e:
            print(f"Error getting user profile ID: {e}")
            return None
    
    async def listen_to_redis(self):
        """Lắng nghe thông báo từ kênh Redis của người dùng"""
        try:
            # Kết nối tới Redis
            redis_kwargs = {
                'host': settings.REDIS_HOST,
                'port': int(settings.REDIS_PORT),
                'db': int(settings.REDIS_DB),
                'decode_responses': True
            }
            
            # Chỉ thêm password nếu được cấu hình
            if settings.REDIS_PASSWORD:
                redis_kwargs['password'] = settings.REDIS_PASSWORD
            
            redis = await aioredis.Redis(**redis_kwargs)
            pubsub = redis.pubsub()
            
            # Đăng ký channel Redis của người dùng
            channel = f"user:{self.profile_id}:notifications"
            await pubsub.subscribe(channel)
            
            print(f"Listening to Redis channel: {channel}")
            
            # Lắng nghe thông báo
            async for message in pubsub.listen():
                if message["type"] == "message":
                    # Nhận được thông báo, gửi tới nhóm qua channel layer
                    await self.channel_layer.group_send(
                        self.notification_group_name,
                        {
                            "type": "notification_message",
                            "message": message["data"]
                        }
                    )
        except asyncio.CancelledError:
            print(f"Redis listener for user {self.profile_id} was cancelled")
        except Exception as e:
            print(f"Error in Redis listener for user {self.profile_id}: {e}")
        finally:
            # Đảm bảo đóng kết nối Redis khi kết thúc
            if 'pubsub' in locals():
                await pubsub.unsubscribe(channel)
            if 'redis' in locals():
                await redis.close()
    
    async def notification_message(self, event):
        """Gửi thông báo tới WebSocket client"""
        message_data = event["message"]
        
        # Gửi thông báo tới WebSocket
        await self.send(text_data=json.dumps({
            "type": "notification",
            "data": message_data
        }))
    
    async def receive(self, text_data):
        """Xử lý tin nhắn nhận từ client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # Có thể xử lý các loại tin nhắn khác nhau từ client
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
        except Exception as e:
            print(f"Error handling message from client: {e}")