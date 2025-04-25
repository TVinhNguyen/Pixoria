from django.core.cache import cache
from django.http import JsonResponse
import time
import logging

# Tạo logger để ghi log lỗi
logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    """
    Middleware để giới hạn số lượng request API từ một người dùng hoặc IP trong một khoảng thời gian
    """
    def __init__(self, get_response):
        self.get_response = get_response
        # Kiểm tra kết nối Redis lúc khởi tạo
        self.redis_available = self._check_redis()

    def _check_redis(self):
        """Kiểm tra xem Redis có sẵn sàng sử dụng không"""
        try:
            # Thử thực hiện một thao tác đơn giản với Redis
            cache.set('redis_check', 'OK', 5)
            result = cache.get('redis_check')
            return result == 'OK'
        except Exception as e:
            logger.warning(f"Redis không khả dụng: {e}")
            return False

    def __call__(self, request):
        # Bỏ qua nếu không phải API request
        if not request.path.startswith('/api/'):
            return self.get_response(request)
            
        # Nếu Redis không khả dụng, bỏ qua rate limiting
        if not self.redis_available:
            return self.get_response(request)
            
        try:
            # Lấy user ID hoặc IP làm định danh
            identifier = request.user.id if request.user.is_authenticated else request.META.get('REMOTE_ADDR')
            rate_key = f'ratelimit:{identifier}'
            
            # Kiểm tra số lần request trong 1 phút
            request_count = cache.get(rate_key, 0)
            
            # Giới hạn là 100 request/phút
            if request_count >= 100:
                return JsonResponse({'error': 'Vượt quá giới hạn số lượng yêu cầu. Vui lòng thử lại sau.'}, status=429)
                
            # Tăng số lần request và set thời gian hết hạn
            cache.set(rate_key, request_count + 1, 60)  # Hết hạn sau 60 giây
        except Exception as e:
            # Ghi log lỗi và cho phép request đi qua nếu có lỗi
            logger.error(f"Lỗi khi kiểm tra rate limit: {e}")
        
        return self.get_response(request)