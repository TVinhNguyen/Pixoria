from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import CreateAPIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.renderers import TemplateHTMLRenderer, JSONRenderer
from rest_framework.views import APIView

import os
import tempfile
from .models import Category, Image, UserProfile, ImageCategory, Notification, Collection , Follow
from .serializers import (
    CategorySerializer, ImageSerializer, CollectionSerializer,
    UserSerializer, RegisterSerializer, UserProfileSerializer, 
    ImagesCategorySerializer, NotificationSerializer , FollowSerializer 
    , ImageSearchSerializer, SimilarImageResultSerializer
)
from .image_search import ImageSearch

# Import hàm tiện ích để tạo thông báo
from .utils import create_notification


class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:  
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)  

    def get_permissions(self):
        if self.action in ['create', 'get_user_by_username']: 
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]  

    def perform_create(self, serializer):
        user = serializer.save()
        user.set_password(user.password)
        user.save()

    def perform_update(self, serializer):
        user = serializer.instance
        password = serializer.validated_data.get("password", None)
        if password:
            user.set_password(password)
        serializer.save()

    @action(detail=False, methods=['get'], url_path='get-user')
    def get_user_by_username(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=400)
        user = get_object_or_404(User, username=username)
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user).order_by("id")

    def perform_update(self, serializer):
        if self.request.user != serializer.instance.user:
            return Response({"error": "Bạn không có quyền chỉnh sửa hồ sơ này"}, status=403)
        serializer.save()

    @action(detail=False, methods=['get'], url_path='get-profile')
    def get_profile_by_username(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(User, username=username)
        user_profile = UserProfile.objects.filter(user=user).first()
        if not user_profile:
            return Response({'error': 'UserProfile not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(user_profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Collection.objects.filter(Q(is_public=True) | Q(user=user_profile))

    def check_object_permissions(self, request, obj):
        if obj.user != request.user.userprofile:
            self.permission_denied(request, message="Bạn không có quyền thực hiện thao tác này.")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user.userprofile)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        return super().destroy(request, *args, **kwargs)


class ImageViewSet(viewsets.ModelViewSet):
    serializer_class = ImageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        if self.action in ["public_images", "list", "search_similar"]:  
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            public = self.request.query_params.get("public", None)
            if public and public.lower() == "true":
                return Image.objects.filter(is_public=True)
            return Image.objects.filter(user=self.request.user.userprofile)
        return Image.objects.filter(is_public=True) 
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user.userprofile)

    @action(detail=False, permission_classes=[AllowAny])
    def public_images(self, request):
        queryset = Image.objects.filter(is_public=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    
    @action(detail=True, methods=['post'], url_path='like')
    def like_image(self, request, pk=None):
        """API endpoint để like ảnh và tạo thông báo"""
        image = self.get_object()
        # Xử lý logic like ở đây (thêm vào model Like nếu có)
        image.likes += 1
        image.save()
        
        # Tạo thông báo cho chủ sở hữu ảnh
        if hasattr(request.user, 'userprofile') and image.user != request.user.userprofile:
            create_notification(
                sender_profile=request.user.userprofile,
                recipient_profile=image.user,
                notification_type='like',
                content=f"liked your photo '{image.title or 'Untitled'}'"
            )
        
        return Response({"status": "success", "likes": image.likes})
    
    @action(detail=True, methods=['post'], url_path='comment')
    def comment_image(self, request, pk=None):
        """API endpoint để comment ảnh và tạo thông báo"""
        image = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({
                "error": "Comment content is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Xử lý logic comment ở đây (thêm vào model Comment nếu có)
        # comment = Comment.objects.create(...)
        
        # Tạo thông báo cho chủ sở hữu ảnh
        if hasattr(request.user, 'userprofile') and image.user != request.user.userprofile:
            create_notification(
                sender_profile=request.user.userprofile,
                recipient_profile=image.user,
                notification_type='comment',
                content=f"commented on your photo: '{content[:30]}...'" if len(content) > 30 else f"commented on your photo: '{content}'"
            )
        
        return Response({"status": "success", "message": "Comment posted successfully"})



class ImageSearchViewSet(viewsets.ViewSet):
    """ViewSet để tìm kiếm ảnh tương tự"""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def list(self, request):
        """Hiển thị form tìm kiếm (tương đương với GET request trong APIView)"""
        return Response({
            'message': 'Tìm kiếm ảnh tương tự',
            'instructions': 'Sử dụng POST request để upload ảnh hoặc cung cấp URL ảnh'
        })
    
    def create(self, request):
        """Xử lý tìm kiếm ảnh (tương đương với POST request trong APIView)"""
        # Kiểm tra dữ liệu đầu vào
        image_file = request.FILES.get('image_file')
        image_url = request.data.get('image_url')
        top_k = int(request.data.get('top_k', 10))
        
        if not image_file and not image_url:
            return Response({
                "error": "Vui lòng cung cấp image_file hoặc image_url"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Khởi tạo ImageSearch
            image_search = ImageSearch.get_instance()
            
            # Tìm kiếm với URL hoặc file
            if image_url:
                search_results = image_search.search(image_url, top_k=top_k)
            elif image_file:
                # Lưu file tạm thời
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    for chunk in image_file.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name
                    
                try:
                    search_results = image_search.search(tmp_path, top_k=top_k)
                finally:
                    # Xóa file tạm
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
            
            # Debug: in ra cấu trúc của kết quả
            print(f"Search results count: {len(search_results) if search_results else 0}")
            
            # Tìm các ảnh trong database dựa vào kết quả FAISS
            results_with_db_data = []
            
            for result in search_results:
                # Đảm bảo result là dictionary
                if not isinstance(result, dict):
                    print(f"Bỏ qua kết quả không hợp lệ: {result}")
                    continue
                    
                # Xác định ID từ kết quả
                image_id = None
                if 'id' in result:
                    try:
                        # Chuyển đổi ID thành số nguyên nếu có thể
                        image_id = int(result['id']) if isinstance(result['id'], str) else result['id']
                    except (ValueError, TypeError):
                        print(f"Không thể chuyển đổi ID: {result.get('id')}")
                        
                # Nếu có ID hợp lệ, tìm trong database
                if image_id is not None:
                    try:
                        # Lọc ảnh theo người dùng và quyền truy cập
                        if request.user.is_authenticated:
                            img = Image.objects.filter(
                                Q(id=image_id, is_public=True) | 
                                Q(id=image_id, user=request.user.userprofile)
                            ).first()
                        else:
                            img = Image.objects.filter(
                                id=image_id, 
                                is_public=True
                            ).first()
                        
                        # Nếu tìm thấy ảnh trong database
                        if img:
                            # Tạo kết quả với dữ liệu từ database
                            result_item = {
                                'id': img.id,
                                'file': img.file.url if hasattr(img.file, 'url') else str(img.file),
                                'title': getattr(img, 'title', ''),
                                'description': getattr(img, 'description', ''),
                                'created_at': getattr(img, 'created_at', None),
                                'distance': result.get('distance', 0),
                                'similarity': round(100 * (1 - min(result.get('distance', 0) / 2, 1)), 2)
                            }
                            
                            # Thêm các trường tùy chọn tùy thuộc vào model của bạn
                            if hasattr(img, 'user'):
                                if hasattr(img.user, 'user') and hasattr(img.user.user, 'username'):
                                    result_item['user'] = img.user.user.username
                                else:
                                    result_item['user'] = str(img.user)
                                    
                            if hasattr(img, 'likes'):
                                result_item['likes'] = img.likes
                                
                            if hasattr(img, 'is_public'):
                                result_item['is_public'] = img.is_public
                                
                            results_with_db_data.append(result_item)
                    except Exception as e:
                        print(f"Lỗi khi xử lý ảnh ID {image_id}: {str(e)}")
                else:
                    # Nếu không có ID hoặc không tìm thấy trong database, sử dụng thông tin từ kết quả FAISS
                    file_url = result.get('file', '')
                    result_item = {
                        'file': file_url,
                        'distance': result.get('distance', 0),
                        'similarity': round(100 * (1 - min(result.get('distance', 0) / 2, 1)), 2),
                        'from_index_only': True  # Đánh dấu rằng đây chỉ là dữ liệu từ index
                    }
                    
                    # Sao chép các trường khác nếu có
                    for key in result:
                        if key not in result_item and key != 'distance':
                            result_item[key] = result[key]
                            
                    results_with_db_data.append(result_item)
            
            return Response({
                'count': len(results_with_db_data),
                'results': results_with_db_data
            })
                
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"ERROR: {str(e)}")
            print(f"TRACEBACK: {error_traceback}")
            return Response({
                'error': f'Lỗi khi tìm kiếm ảnh tương tự: {str(e)}',
                'traceback': error_traceback
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='upload')
    def search_by_upload(self, request):
        """Endpoint tìm kiếm bằng file ảnh tải lên"""
        self.permission_classes = [AllowAny]

        image_file = request.FILES.get('image_file')
        if not image_file:
            return Response({
                "error": "Vui lòng cung cấp file ảnh"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sử dụng phương thức create để xử lý
        return self.create(request)
    
    @action(detail=False, methods=['post'], url_path='url')
    def search_by_url(self, request):
        """Endpoint tìm kiếm bằng URL ảnh"""
        self.permission_classes = [AllowAny]

        image_url = request.data.get('image_url')
        if not image_url:
            return Response({
                "error": "Vui lòng cung cấp URL ảnh"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sử dụng phương thức create để xử lý
        return self.create(request)
class ImagesCategoryViewSet(viewsets.ModelViewSet):
    queryset = ImageCategory.objects.select_related('image', 'category', 'image__user').order_by('id')
    serializer_class = ImagesCategorySerializer
    permission_classes = [IsAuthenticated]

class FollowViewSet(viewsets.ModelViewSet):
    """ViewSet for Follow model operations"""
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return follows based on request parameters"""
        queryset = Follow.objects.all()
        
        # Filter by follower if specified
        follower_id = self.request.query_params.get('follower_id')
        if follower_id:
            queryset = queryset.filter(follower_id=follower_id)
            
        # Filter by following if specified
        following_id = self.request.query_params.get('following_id')
        if following_id:
            queryset = queryset.filter(following_id=following_id)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new follow relationship"""
        # Get the current user's profile
        current_user_profile = request.user.userprofile
        
        # Get the user to follow
        following_id = request.data.get('following')
        following_profile = get_object_or_404(UserProfile, id=following_id)
        
        # Prevent self-following
        if current_user_profile.id == following_profile.id:
            return Response(
                {"error": "Không thể tự follow chính mình."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if follow relationship already exists
        if Follow.objects.filter(follower=current_user_profile, following=following_profile).exists():
            return Response(
                {"error": "Bạn đã follow người dùng này rồi."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Create new follow relationship
        follow = Follow.objects.create(
            follower=current_user_profile,
            following=following_profile
        )
        
        serializer = self.get_serializer(follow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """Unfollow a user"""
        follow = self.get_object()
        
        # Ensure the current user is the follower
        if follow.follower.user != request.user:
            return Response(
                {"error": "Bạn không có quyền thực hiện hành động này."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle_follow(self, request):
        """Toggle follow/unfollow a user"""
        current_user_profile = request.user.userprofile
        following_id = request.data.get('following')
        
        if not following_id:
            return Response(
                {"error": "Vui lòng cung cấp ID người dùng cần follow/unfollow."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        following_profile = get_object_or_404(UserProfile, id=following_id)
        
        # Prevent self-following
        if current_user_profile.id == following_profile.id:
            return Response(
                {"error": "Không thể tự follow chính mình."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if follow relationship exists
        follow_obj = Follow.objects.filter(
            follower=current_user_profile, 
            following=following_profile
        ).first()
        
        if follow_obj:
            # Unfollow
            follow_obj.delete()
            return Response(
                {"message": "Đã unfollow thành công.", "action": "unfollow"}, 
                status=status.HTTP_200_OK
            )
        else:
            # Follow
            follow_obj = Follow.objects.create(
                follower=current_user_profile,
                following=following_profile
            )
            serializer = self.get_serializer(follow_obj)
            return Response(
                {"message": "Đã follow thành công.", "action": "follow", "data": serializer.data}, 
                status=status.HTTP_201_CREATED
            )
class NotificationViewSet(mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin,
                          viewsets.GenericViewSet):
    """
    ViewSet cho Notification.
    Chỉ cho phép list, retrieve và update (để đánh dấu đã đọc)
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user.userprofile)

    @action(detail=False, methods=['get'], url_path='get-notifications')
    def get_notifications(self, request):
        """Lấy tất cả thông báo của người dùng hiện tại"""
        notifications = self.get_queryset().order_by('-sent_at')
        
        # Thêm tùy chọn giới hạn số lượng thông báo
        limit = request.query_params.get('limit')
        if limit and limit.isdigit():
            notifications = notifications[:int(limit)]
            
        # Thêm tùy chọn chỉ lấy thông báo chưa đọc
        unread_only = request.query_params.get('unread')
        if unread_only and unread_only.lower() == 'true':
            notifications = notifications.filter(is_read=False)
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """API endpoint để đánh dấu một thông báo là đã đọc"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request):
        """API endpoint để đánh dấu tất cả thông báo là đã đọc"""
        notifications = self.get_queryset()
        notifications.update(is_read=True)
        return Response({"status": "success", "message": "All notifications marked as read"})
    
    @action(detail=False, methods=['get'], url_path='count')
    def get_notification_count(self, request):
        """API endpoint để lấy số lượng thông báo chưa đọc"""
        unread_count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": unread_count})
    
    # Vô hiệu hóa các phương thức tạo và xoá thông báo qua API
    def create(self, request, *args, **kwargs):
        return Response(
            {"error": "Creating notifications directly is not allowed"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "Deleting notifications is not allowed"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )