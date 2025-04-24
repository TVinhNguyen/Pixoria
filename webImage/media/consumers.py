import json
import asyncio
import time
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
            print(f"WebSocket connection rejected: User not authenticated")
            await self.close()
            return

        # Lấy ID user profile để tạo tên nhóm
        self.profile_id = await self.get_user_profile_id(self.user)
        if not self.profile_id:
            print(f"WebSocket connection rejected: Could not get profile ID for user {self.user.id}")
            await self.close()
            return
            
        self.notification_group_name = f"user_{self.profile_id}_notifications"
        
        # Khởi tạo bộ lưu trữ message_id đã xử lý để tránh trùng lặp
        self.processed_messages = set()
        
        # Tham gia nhóm kênh
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        # Chấp nhận kết nối WebSocket
        await self.accept()
        print(f"WebSocket connection accepted for user {self.user.id}, profile {self.profile_id}")
        
        # Bắt đầu lắng nghe Redis trong một task riêng biệt
        self.redis_task = asyncio.create_task(self.listen_to_redis())
        
        # Thêm task heartbeat để giữ kết nối
        self.heartbeat_task = asyncio.create_task(self.send_heartbeat())
    
    async def disconnect(self, close_code):
        # Hủy task lắng nghe Redis nếu đang chạy
        if hasattr(self, 'redis_task') and not self.redis_task.done():
            self.redis_task.cancel()
            
        # Hủy task heartbeat nếu đang chạy
        if hasattr(self, 'heartbeat_task') and not self.heartbeat_task.done():
            self.heartbeat_task.cancel()
            
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
    
    async def send_heartbeat(self):
        """Gửi heartbeat định kỳ để giữ kết nối WebSocket"""
        try:
            while True:
                await asyncio.sleep(30)  # Gửi heartbeat mỗi 30 giây
                await self.send(text_data=json.dumps({
                    "type": "heartbeat",
                    "timestamp": time.time()
                }))
                print(f"Sent heartbeat to user {self.profile_id}")
        except asyncio.CancelledError:
            print(f"Heartbeat task cancelled for user {self.profile_id}")
        except Exception as e:
            print(f"Error in heartbeat task for user {self.profile_id}: {e}")
    
    async def listen_to_redis(self):
        """Lắng nghe thông báo từ kênh Redis của người dùng"""
        redis = None
        pubsub = None
        channel = f"user:{self.profile_id}:notifications"
        
        try:
            start_time = time.time()
            print(f"Starting Redis listener for user {self.profile_id} at {start_time}")
            
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
            await pubsub.subscribe(channel)
            
            print(f"Listening to Redis channel: {channel}, connection time: {time.time() - start_time:.2f}s")
            
            # Lắng nghe thông báo
            async for message in pubsub.listen():
                if message["type"] == "message":
                    # Ghi log thời gian nhận được tin nhắn
                    receive_time = time.time()
                    message_data = message["data"]
                    
                    # Tạo message_id duy nhất dựa trên nội dung tin nhắn để tránh gửi trùng lặp
                    try:
                        # Parse JSON data để lấy ID thông báo
                        notification_data = json.loads(message_data)
                        message_id = f"{notification_data.get('id')}:{notification_data.get('type')}:{notification_data.get('sender_id')}"
                        
                        # Kiểm tra xem message_id đã được xử lý chưa
                        if message_id in self.processed_messages:
                            print(f"Skipping duplicate message {message_id} for user {self.profile_id}")
                            continue
                        
                        # Thêm message_id vào danh sách đã xử lý
                        self.processed_messages.add(message_id)
                        
                        # Giới hạn kích thước của set để tránh sử dụng quá nhiều bộ nhớ
                        if len(self.processed_messages) > 1000:
                            self.processed_messages = set(list(self.processed_messages)[-500:])
                    except json.JSONDecodeError:
                        # Nếu không parse được JSON, tạo ID dựa trên hash nội dung
                        message_id = hash(message_data)
                        
                        if message_id in self.processed_messages:
                            continue
                            
                        self.processed_messages.add(message_id)
                    
                    print(f"Received message for user {self.profile_id} at {receive_time}")
                    
                    # Nhận được thông báo, gửi tới nhóm qua channel layer
                    await self.channel_layer.group_send(
                        self.notification_group_name,
                        {
                            "type": "notification_message",
                            "message": message_data,
                            "message_id": message_id,
                            "received_at": receive_time
                        }
                    )
        except asyncio.CancelledError:
            print(f"Redis listener for user {self.profile_id} was cancelled")
        except Exception as e:
            print(f"Error in Redis listener for user {self.profile_id}: {e}")
        finally:
            # Đảm bảo đóng kết nối Redis khi kết thúc
            try:
                if pubsub:
                    await pubsub.unsubscribe(channel)
                if redis:
                    await redis.close()
            except Exception as e:
                print(f"Error closing Redis connections: {e}")
    
    async def notification_message(self, event):
        """Gửi thông báo tới WebSocket client"""
        try:
            message_data = event["message"]
            message_id = event.get("message_id", "unknown")
            received_at = event.get("received_at", time.time())
            delivery_time = time.time() - received_at
            
            # Ghi log thông tin thời gian gửi tin nhắn
            print(f"Sending notification to user {self.profile_id}, message_id: {message_id}, delivery time: {delivery_time:.3f}s")
            
            # Gửi thông báo tới WebSocket
            await self.send(text_data=json.dumps({
                "type": "notification",
                "message_id": message_id,  # Thêm message_id để client có thể phát hiện và lọc trùng lặp
                "data": message_data,
                "delivery_time_ms": int(delivery_time * 1000)
            }))
        except Exception as e:
            print(f"Error sending notification to client: {e}")
    
    async def receive(self, text_data):
        """Xử lý tin nhắn nhận từ client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # Có thể xử lý các loại tin nhắn khác nhau từ client
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': time.time()
                }))
                print(f"Received ping from user {self.profile_id}, sent pong response")
        except Exception as e:
            print(f"Error handling message from client: {e}")