import json
from .models import Notification
from django.core.cache import cache
import redis
from django.conf import settings

# Khởi tạo kết nối Redis cho PubSub
try:
    redis_kwargs = {
        'host': settings.REDIS_HOST,
        'port': settings.REDIS_PORT,
        'db': settings.REDIS_DB,
        'decode_responses': True
    }
    
    # Chỉ thêm password nếu nó được cấu hình
    if settings.REDIS_PASSWORD:
        redis_kwargs['password'] = settings.REDIS_PASSWORD
    
    redis_client = redis.Redis(**redis_kwargs)
    
    # Kiểm tra kết nối
    redis_client.ping()
    print("✅ Kết nối Redis thành công!")
except Exception as e:
    print(f"⚠️ Không thể kết nối với Redis PubSub: {e}")
    redis_client = None

def create_notification(sender_profile, recipient_profile, notification_type, content):
    """
    Tạo thông báo và lưu vào cả database và Redis để hỗ trợ thông báo thời gian thực
    """
    # Kiểm tra null
    if not sender_profile or not recipient_profile:
        print("Error: Both sender and recipient are required")
        return None
    
    # Tránh gửi thông báo cho chính mình
    if sender_profile == recipient_profile:
        return None
    
    try:
        # Tạo thông báo trong database
        notification = Notification(
            sender=sender_profile,
            recipient=recipient_profile,
            type=notification_type,
            content=content
        )
        notification.save()
        
        # Nếu có kết nối Redis, đẩy thông báo vào PubSub
        if redis_client:
            try:
                # Chuẩn bị dữ liệu thông báo
                notification_data = {
                    'id': notification.id,
                    'type': notification_type,
                    'content': content,
                    'sender_id': sender_profile.id,
                    'sender_username': sender_profile.user.username,
                    'sender_avatar': sender_profile.avatar.url if sender_profile.avatar else None,
                    'created_at': notification.sent_at.isoformat()
                }
                
                # Đẩy thông báo vào channel của người nhận
                channel = f'user:{recipient_profile.id}:notifications'
                redis_client.publish(channel, json.dumps(notification_data))
                
                # Lưu thông báo vào danh sách notifications của user để hiển thị khi user online
                unread_key = f'user:{recipient_profile.id}:unread_notifications'
                redis_client.incr(unread_key)
                
                # Lưu 10 thông báo gần nhất vào Redis List
                recent_key = f'user:{recipient_profile.id}:recent_notifications'
                redis_client.lpush(recent_key, json.dumps(notification_data))
                redis_client.ltrim(recent_key, 0, 9)  # Chỉ giữ 10 thông báo gần nhất
                
                print(f"Notification pushed to Redis channel: {channel}")
            except Exception as e:
                print(f"Redis notification error: {e}")
        
        return notification
    except Exception as e:
        print(f"Error creating notification: {str(e)}")
        return None

def get_unread_notifications_count(user_profile):
    """
    Lấy số lượng thông báo chưa đọc của người dùng từ Redis hoặc database
    """
    if not user_profile:
        return 0
    
    try:
        # Thử lấy từ Redis trước
        if redis_client:
            unread_key = f'user:{user_profile.id}:unread_notifications'
            count = redis_client.get(unread_key)
            if count is not None:
                return int(count)
        
        # Nếu không có trong Redis, đếm từ database
        count = Notification.objects.filter(recipient=user_profile, is_read=False).count()
        
        # Cập nhật lại Redis
        if redis_client:
            unread_key = f'user:{user_profile.id}:unread_notifications'
            redis_client.set(unread_key, count)
        
        return count
    except Exception as e:
        print(f"Error getting unread notifications count: {e}")
        # Fallback to database
        return Notification.objects.filter(recipient=user_profile, is_read=False).count()

def mark_notifications_as_read(user_profile, notification_ids=None):
    """
    Đánh dấu thông báo đã đọc (tất cả hoặc theo danh sách id)
    """
    try:
        # Đánh dấu trong database
        notifications_query = Notification.objects.filter(recipient=user_profile, is_read=False)
        if notification_ids:
            notifications_query = notifications_query.filter(id__in=notification_ids)
        
        notifications_query.update(is_read=True)
        
        # Cập nhật Redis
        if redis_client:
            unread_key = f'user:{user_profile.id}:unread_notifications'
            if notification_ids:
                # Giảm số lượng thông báo chưa đọc
                redis_client.decrby(unread_key, len(notification_ids))
            else:
                # Đặt lại về 0 nếu đánh dấu tất cả là đã đọc
                redis_client.set(unread_key, 0)
        
        return True
    except Exception as e:
        print(f"Error marking notifications as read: {e}")
        return False