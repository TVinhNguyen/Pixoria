from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import CreateAPIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from clip_retrieval.clip_search import CLIPImageSearch
import boto3
from django.conf import settings
import traceback

import os
import tempfile
from .models import Category, Image, UserProfile, ImageCategory, Notification, Collection , Follow, LikedImage
from .serializers import (
    CategorySerializer, ImageSerializer, CollectionSerializer,
    UserSerializer, RegisterSerializer, UserProfileSerializer, 
    ImagesCategorySerializer, NotificationSerializer , FollowSerializer , LikedImageSerializer, DownloadedImage
    , ImageSearchSerializer, SimilarImageResultSerializer
)
from .image_search import ImageSearch

# Import hàm tiện ích để tạo thông báo
from .utils import create_notification
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger


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
        current_profile = self.request.user.userprofile
        target_username = self.kwargs.get('username')
        if target_username:
            target_profile = get_object_or_404(UserProfile, user__username=target_username)
            if target_profile == current_profile:
                return Collection.objects.filter(user=target_profile)
            else:
                return Collection.objects.filter(user=target_profile, is_public=True)
        else:
            return Collection.objects.filter(user=current_profile)
    def check_object_permissions(self, request, obj):
        # Kiểm tra quyền chỉnh sửa: chỉ chủ sở hữu mới được cập nhật hay xóa collection của mình
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.user != request.user.userprofile:
                self.permission_denied(request, message="Bạn không có quyền thực hiện thao tác này.")
        

    def perform_create(self, serializer):
        # Khi tạo mới, gán owner là profile của người request
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
    queryset = Image.objects.all()
    
    def get_permissions(self):
        if self.action in ["public_images","images_by_category", "list", "search_similar", "user_images", "retrieve"]:  
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Tối ưu truy vấn để bao gồm thông tin tác giả và cải thiện hiệu suất
        """
        # Base queryset với select_related để tối ưu hiệu suất, đảm bảo có thông tin tác giả
        queryset = Image.objects.select_related(
            'user',          # UserProfile
            'user__user'     # User từ UserProfile
        )
        
        # Nếu người dùng đã đăng nhập, xác định phạm vi ảnh hiển thị
        if self.request.user.is_authenticated:
            public = self.request.query_params.get("public", None)
            if public and public.lower() == "true":
                return queryset.filter(is_public=True)
            # Mặc định chỉ hiển thị ảnh của người dùng
            return queryset.filter(user=self.request.user.userprofile)
        
        # Người dùng chưa đăng nhập chỉ thấy ảnh public
        return queryset.filter(is_public=True)
    
    def get_serializer_context(self):
        """
        Bổ sung context cho serializer để có thể truy cập request
        """
        context = super().get_serializer_context()
        return context
    
    def perform_create(self, serializer):
        """
        Tự động gán người dùng hiện tại khi tạo ảnh mới và xử lý danh mục
        """
        # Lưu ảnh và gán cho người dùng hiện tại
        image = serializer.save(user=self.request.user.userprofile)
        
        # Xử lý categories nếu có
        categories = self.request.data.getlist('categories', [])
        if categories:
            for category_id in categories:
                try:
                    category = Category.objects.get(id=category_id)
                    ImageCategory.objects.create(image=image, category=category)
                except Category.DoesNotExist:
                    # Có thể log lỗi hoặc bỏ qua nếu category không tồn tại
                    pass
                except Exception as e:
                    print(f"Lỗi khi thêm danh mục {category_id} cho ảnh {image.id}: {str(e)}")
        
        return image
    def perform_destroy(self, instance):
        """
        Xoá ảnh trên AWS S3 trước khi xoá bản ghi trong database
        """
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )

        # Store ID for later logging
        image_id = instance.id
        file_name = instance.file.name if instance.file else "No file"

        try:
            if instance.file:
                s3_key = instance.file.name
                s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=s3_key)
                print(f"Deleted from S3: {s3_key}")
        except Exception as e:
            print(f"Error deleting from S3: {e}")

        # Force direct deletion with Django ORM - bypass the soft delete mechanism if any
        try:
            from django.db import connection
            # Ensure Django's signals are triggered for proper cleanup of related data
            Image.objects.filter(id=instance.id).delete()
            print(f"Successfully deleted Image #{image_id} ({file_name}) from database using ORM")
        except Exception as e:
            print(f"Error using ORM delete for Image #{image_id}: {e}")
            try:
                # Last resort: direct SQL delete
                print(f"Attempting direct SQL delete for Image #{image_id}")
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM media_image WHERE id = %s", [instance.id])
                print(f"Successfully deleted Image #{image_id} using direct SQL")
            except Exception as e2:
                print(f"Error using direct SQL delete: {e2}")
                # If all else fails, try the default mechanism
                try:
                    super().perform_destroy(instance)
                except Exception as e3:
                    print(f"Final error deleting Image #{image_id}: {e3}")
                    raise

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy method to ensure image is deleted from database
        """
        instance = self.get_object()
        # Store ID for later reference
        image_id = instance.id
        file_name = instance.file.name if instance.file else "No file"

        user_profile = instance.user
        
        # Get confirmation from perform_destroy before returning response
        self.perform_destroy(instance)
        
        # Log to verify deletion was successful
        print(f"Database record for Image #{image_id} ({file_name}) has been deleted")

        try:
            user_profile.update_counts()
            print(f"User {user_profile.user.username} updated counts after deleting image {image_id}")
        except Exception as e:
            print(f"Error updating user profile counts: {e}")
        
        # Return no content response
        return Response(status=status.HTTP_204_NO_CONTENT)

    
    @action(detail=False, permission_classes=[AllowAny], url_path='user/(?P<username>[^/.]+)')
    def user_images(self, request, username=None):
        """API để lấy tất cả ảnh của một user theo username"""
        user = get_object_or_404(UserProfile, user__username=username)
        
        # Apply filters
        queryset = Image.objects.filter(user=user).select_related('user', 'user__user')
        
        # Filter by public/private if specified
        visibility = request.query_params.get('visibility')
        if (visibility == 'public'):
            queryset = queryset.filter(is_public=True)
        elif (visibility == 'private' and request.user.is_authenticated and request.user.username == username):
            queryset = queryset.filter(is_public=False)
        elif (not request.user.is_authenticated or request.user.username != username):
            # For others, only show public images
            queryset = queryset.filter(is_public=True)
        
        # Apply sorting
        sort_by = request.query_params.get('sort', 'created_at')
        order = request.query_params.get('order', 'desc')
        
        if sort_by in ['created_at', 'likes', 'downloads']:
            sort_field = f"{'-' if order == 'desc' else ''}{sort_by}"
            queryset = queryset.order_by(sort_field)
        
        # Use pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, permission_classes=[AllowAny])
    def public_images(self, request):
        """
        Lấy danh sách ảnh công khai với phân trang và sắp xếp
        """
        queryset = Image.objects.filter(is_public=True).select_related(
            'user', 'user__user'
        )
        
        # Sắp xếp theo tham số từ request
        sort_by = request.query_params.get('sort', 'created_at')
        order = request.query_params.get('order', 'desc')
        
        if sort_by in ['created_at', 'likes', 'downloads']:
            sort_field = f"{'-' if order == 'desc' else ''}{sort_by}"
            queryset = queryset.order_by(sort_field)
        
        # Phân trang cho kết quả
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='category/(?P<category_id>[^/.]+)')
    def images_by_category(self, request, category_id=None):
        """Endpoint lấy ảnh theo category ID hoặc slug"""
        # # Make sure permission is properly applied for this specific view by overriding get_permissions
        # self.permission_classes = [AllowAny]
        # self.check_permissions(request)
        
        try:
            # Xác định nếu tham số là slug (string) hay ID (số)
            if category_id.isdigit():
                # Nếu là số, tìm theo ID
                category = get_object_or_404(Category, id=category_id)
            else:
                # Nếu là chuỗi, tìm theo slug
                category = get_object_or_404(Category, slug=category_id)
            
            # Tìm các bản ghi ImageCategory chứa category
            image_categories = ImageCategory.objects.filter(category=category)
            image_ids = image_categories.values_list('image_id', flat=True)
            
            # Lấy các ảnh public hoặc ảnh của người dùng hiện tại
            if request.user.is_authenticated:
                queryset = Image.objects.filter(
                    Q(id__in=image_ids, is_public=True) | 
                    Q(id__in=image_ids, user=request.user.userprofile)
                ).select_related('user', 'user__user')
            else:
                queryset = Image.objects.filter(
                    id__in=image_ids, 
                    is_public=True
                ).select_related('user', 'user__user')
            
            # Áp dụng sắp xếp tương tự như phương thức public_images
            sort_by = request.query_params.get('sort', 'created_at')
            order = request.query_params.get('order', 'desc')
            
            if sort_by in ['created_at', 'likes', 'downloads']:
                sort_field = f"{'-' if order == 'desc' else ''}{sort_by}"
                queryset = queryset.order_by(sort_field)
            
            # Áp dụng phân trang
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'category': CategorySerializer(category).data,
                    'images': serializer.data
                })
            
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'category': CategorySerializer(category).data,
                'images': serializer.data
            })
        
        except Exception as e:
            return Response({
                'error': f'Lỗi khi lấy ảnh theo danh mục: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=True, methods=['post'], url_path='like')
    def like_image(self, request, pk=None):
        """API endpoint để like ảnh, tự động xác định loại ảnh"""
        try:
            # Kiểm tra trực tiếp xem ID có hợp lệ không
            if not pk or not pk.isdigit():
                return Response(
                    {"detail": "Invalid image ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Tìm ảnh theo ID, sử dụng select_related để tối ưu
            image = get_object_or_404(
                Image.objects.select_related('user', 'user__user'),
                id=pk
            )
            
            # Xử lý người dùng chưa đăng nhập
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required to like images."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Lấy userprofile của người dùng hiện tại
            try:
                user_profile = request.user.userprofile
            except Exception as e:
                print(f"Error getting user profile: {e}")
                return Response(
                    {"detail": "User profile not found. Please complete your profile setup."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Kiểm tra xem người dùng đã like ảnh hay chưa
            liked = LikedImage.objects.filter(user=user_profile, image=image).exists()
            
            if liked:
                # Nếu đã like rồi thì bỏ like
                try:
                    LikedImage.objects.filter(user=user_profile, image=image).delete()
                    image.likes = max(0, image.likes - 1)  # Đảm bảo likes không âm
                    image.save(update_fields=['likes'])  # Chỉ cập nhật trường likes
                    print(f"User {user_profile.user.username} unliked image {image.id}")
                    return Response({"status": "unlike_success", "likes": image.likes})
                except Exception as e:
                    print(f"Error during unlike: {e}")
                    return Response(
                        {"detail": f"Error removing like: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Tiến hành like ảnh
                try:
                    # Tạo bản ghi like trong database
                    LikedImage.objects.create(user=user_profile, image=image)
                    
                    # Tăng số lượt like
                    image.likes += 1
                    image.save(update_fields=['likes'])  # Chỉ cập nhật trường likes
                    
                    print(f"User {user_profile.user.username} liked image {image.id}")
                    
                    # Nếu người dùng có userprofile và ảnh không phải của chính họ thì tạo thông báo
                    if image.user != user_profile:
                        try:
                            create_notification(
                                sender_profile=user_profile,
                                recipient_profile=image.user,
                                notification_type='like',
                                content=f"liked your photo '{image.title or 'Untitled'}'"
                            )
                        except Exception as notification_error:
                            print(f"Error creating notification for like: {notification_error}")
                            # Không trả về lỗi vì thông báo không quan trọng bằng việc like thành công
                    
                    # Trả về cả thông tin ảnh đã cập nhật để frontend có thể cập nhật
                    serializer = self.get_serializer(image)
                    return Response({
                        "status": "like_success", 
                        "likes": image.likes,
                        "image": serializer.data  # Thêm data ảnh cập nhật
                    })
                except Exception as e:
                    print(f"Error during like: {e}")
                    return Response(
                        {"detail": f"Error adding like: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        except Image.DoesNotExist:
            return Response(
                {"detail": f"Image with ID {pk} not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print(f"Unexpected error in like_image: {e}")
            print(traceback.format_exc())
            return Response(
                {"detail": f"An unexpected error occurred: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='download')
    def download_image(self, request, pk=None):
        """API endpoint để tải ảnh, tự động xác định loại ảnh"""
        try:
            # Tìm ảnh theo ID, sử dụng select_related để tối ưu
            image = get_object_or_404(
                Image.objects.select_related('user', 'user__user'),
                id=pk
            )
            
            # Tăng số lượt tải xuống ngay cả khi người dùng chưa đăng nhập
            image.downloads += 1
            image.save(update_fields=['downloads'])  # Chỉ cập nhật trường downloads

            # Xử lý các hành động đăng nhập đòi hỏi
            if request.user.is_authenticated:
                user_profile = request.user.userprofile
                downloaded = DownloadedImage.objects.filter(user=user_profile, image=image).exists()
                
                # Chỉ tạo bản ghi download mới nếu chưa tồn tại
                if not downloaded:
                    DownloadedImage.objects.create(user=user_profile, image=image)
                    
                    # Tạo thông báo nếu ảnh không phải của chính họ
                    if image.user != user_profile:
                        create_notification(
                            sender_profile=user_profile,
                            recipient_profile=image.user,
                            notification_type='download',
                            content=f"downloaded your photo '{image.title or 'Untitled'}'"
                        )
            
            # Trả về thông tin ảnh cập nhật để frontend có thể cập nhật
            serializer = self.get_serializer(image)
            return Response({
                "status": "success", 
                "downloads": image.downloads, 
                "image": serializer.data  # Thêm data ảnh cập nhật
            })

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='comment')
    def comment_image(self, request, pk=None):
        """API endpoint để comment ảnh và tạo thông báo"""
        image = self.get_object()
        content = request.data.get('content')
        
        # Xác thực đầu vào
        if not content:
            return Response({
                "error": "Comment content is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Xử lý người dùng chưa đăng nhập
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to comment on images."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Xử lý logic comment ở đây (thêm vào model Comment nếu có)
        # comment = Comment.objects.create(...)
        
        # Tạo thông báo cho chủ sở hữu ảnh nếu không phải chính họ
        if image.user != request.user.userprofile:
            create_notification(
                sender_profile=request.user.userprofile,
                recipient_profile=image.user,
                notification_type='comment',
                content=f"commented on your photo: '{content[:30]}...'" if len(content) > 30 else f"commented on your photo: '{content}'"
            )
        
        return Response({"status": "success", "message": "Comment posted successfully"})


class ImageSearchViewSet(viewsets.ViewSet):
    """
    ViewSet để tìm kiếm ảnh tương tự.
    Các endpoint:
      - GET /api/image-search/         (list): Trả về thông tin hướng dẫn.
      - POST /api/image-search/        (create): Xử lý tìm kiếm ảnh dựa trên URL hoặc file upload.
      - POST /api/image-search/upload/ (search_by_upload): Tìm kiếm theo file ảnh upload.
      - POST /api/image-search/url/    (search_by_url): Tìm kiếm theo URL ảnh.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request):
        """Hiển thị thông tin hướng dẫn tìm kiếm ảnh (GET request)"""
        return Response({
            'message': 'Tìm kiếm ảnh tương tự',
            'instructions': 'Sử dụng POST request để upload ảnh hoặc cung cấp URL ảnh'
        })

    def create(self, request):
        """Xử lý tìm kiếm ảnh (tương đương với POST request trong APIView)"""
        # Kiểm tra dữ liệu đầu vào
        image_file = request.FILES.get('image_file')
        image_url = request.data.get('image_url')
        query = request.data.get('query')
        top_k = int(request.data.get('top_k', 12))

        try:
            # Use singleton pattern to get CLIPImageSearch instance
            search_engine = CLIPImageSearch.get_instance()

            # Ưu tiên tìm kiếm theo ảnh dựa trên URL
            if image_url:
                # Sử dụng search() của CLIPImageSearch – phiên bản dùng URL để tải ảnh và xử lý embedding
                results = search_engine.search_by_image(image_url, top_k=top_k)
            elif image_file:
                # Lưu file ảnh tạm thời để xử lý
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    for chunk in image_file.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name
                    
                try:
                    results = search_engine.search_by_image(tmp_path, top_k=top_k)
                finally:
                    # Xóa file tạm
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
            else:
                # Nếu không có ảnh nào được cung cấp, bạn có thể xử lý tìm kiếm theo query văn bản.
                # (Chỉ áp dụng nếu bạn hỗ trợ tìm kiếm text; nếu không, trả về thông báo lỗi.)
                results = search_engine.search(query, top_k=top_k)

            # Lấy thêm thông tin từ database, nếu kết quả trả về có id liên kết với model Image
            results_with_db_data = []
            for result in results:
                image_id = result.get('id')
                if image_id:
                    try:
                        if request.user.is_authenticated:
                            img = Image.objects.filter(
                                Q(id=image_id, is_public=True) |
                                Q(id=image_id, user=request.user.userprofile)
                            ).first()
                        else:
                            img = Image.objects.filter(id=image_id, is_public=True).first()

                        if img:
                            result_item = {
                                'id': img.id,
                                'file': img.file.url if hasattr(img.file, 'url') else str(img.file),
                                'title': getattr(img, 'title', ''),
                                'description': getattr(img, 'description', ''),
                                'created_at': getattr(img, 'created_at', None),
                                'distance': result.get('distance', 0),
                                'similarity': round(100 * (1 - min(result.get('distance', 0) / 2, 1)), 2)
                            }
                            # Thêm các trường thông tin khác nếu cần
                            if hasattr(img, 'user'):
                                result_item['user'] = str(img.user)
                            if hasattr(img, 'likes'):
                                result_item['likes'] = img.likes
                            if hasattr(img, 'is_public'):
                                result_item['is_public'] = img.is_public

                            results_with_db_data.append(result_item)
                            continue
                    except Exception as e:
                        print(f"Lỗi khi xử lý ảnh ID {image_id}: {str(e)}")
                # Nếu không có thông tin id hay không liên kết với database, trả về thông tin tìm kiếm trực tiếp từ index
                result_item = {
                    'file': result.get('file', ''),
                    'distance': result.get('distance', 0),
                    'similarity': round(100 * (1 - min(result.get('distance', 0) / 2, 1)), 2),
                    'from_index_only': True
                }
                for key in result:
                    if key not in result_item and key != 'distance':
                        result_item[key] = result[key]
                results_with_db_data.append(result_item)

            return Response({
                'count': len(results_with_db_data),
                'results': results_with_db_data
            })

        except Exception as e:
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

        # Dùng create để xử lý tìm kiếm
        return self.create(request)
    @action(detail=False, methods=['post'], url_path='text')
    def search_by_text(self, request):
        query = request.data.get('query', '')
        top_k = int(request.data.get('top_k', 20))

        if not query:
            return Response({"error": "Vui lòng cung cấp query"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Use singleton pattern to get CLIPImageSearch instance
            search_engine = CLIPImageSearch.get_instance()
            
            # Sử dụng try-except cụ thể cho tìm kiếm text để xử lý lỗi Redis
            try:
                results = search_engine.search(query, top_k=top_k)
            except Exception as search_error:
                print(f"Redis error during text search: {search_error}. Using search without cache.")
                # Thử lại mà không dùng cache nếu có lỗi Redis
                results = search_engine.search(query, top_k=top_k, use_cache=False)
            
            # Chuẩn bị kết quả
            results_with_db_data = []
            for result in results:
                image_id = result.get('id')
                if image_id:
                    try:
                        if request.user.is_authenticated:
                            img = Image.objects.filter(
                                Q(id=image_id, is_public=True) |
                                Q(id=image_id, user=request.user.userprofile)
                            ).first()
                        else:
                            img = Image.objects.filter(id=image_id, is_public=True).first()

                        if img:
                            result_item = {
                                'id': img.id,
                                'file': img.file.url if hasattr(img.file, 'url') else str(img.file),
                                'title': getattr(img, 'title', ''),
                                'description': getattr(img, 'description', ''),
                                'similarity_score': result.get('similarity_score', 0),
                                'user': str(img.user) if hasattr(img, 'user') else None,
                                'likes': getattr(img, 'likes', 0),
                                'downloads': getattr(img, 'downloads', 0),
                            }
                            results_with_db_data.append(result_item)
                    except Exception as e:
                        print(f"Error retrieving image {image_id} data: {e}")
                        # Vẫn giữ nguyên kết quả từ index để không làm mất kết quả tìm kiếm
                        results_with_db_data.append(result)
                else:
                    # Nếu không có ID, thêm kết quả nguyên bản
                    results_with_db_data.append(result)
            
            return Response({
                'count': len(results_with_db_data),
                'results': results_with_db_data
            })
        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"Error in text search: {e}")
            print(f"Traceback: {error_trace}")
            return Response({
                'error': str(e),
                'message': 'Lỗi khi tìm kiếm văn bản. Vui lòng thử lại sau.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='url')
    def search_by_url(self, request):
        """Endpoint tìm kiếm bằng URL ảnh"""
        self.permission_classes = [AllowAny]
        image_url = request.data.get('image_url')
        if not image_url:
            return Response({
                "error": "Vui lòng cung cấp URL ảnh"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Dùng create để xử lý tìm kiếm
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
            
        return queryset.order_by('id')
    
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
        """Lấy thông báo của người dùng hiện tại với hỗ trợ phân trang"""
        notifications = self.get_queryset().order_by('-sent_at')
        # Lấy tham số phân trang từ request
        page = request.query_params.get('page', 1)
        limit = request.query_params.get('limit', 10)
        # Chuyển đổi sang số nguyên, xử lý giá trị không hợp lệ
        try:
            page = int(page)
            limit = int(limit)
        except ValueError:
            page = 1
            limit = 10
        # Lọc thông báo chưa đọc nếu có tham số unread
        unread_only = request.query_params.get('unread')
        if unread_only and unread_only.lower() == 'true':
            notifications = notifications.filter(is_read=False)
        # Áp dụng phân trang
        paginator = Paginator(notifications, limit)
        try:
            notifications_page = paginator.page(page)
        except (EmptyPage, PageNotAnInteger):
            notifications_page = paginator.page(1)  # Mặc định trả về trang 1 nếu lỗi
        # Serialize dữ liệu
        serializer = self.get_serializer(notifications_page, many=True)
        # Trả về dữ liệu cùng với thông tin phân trang
        return Response({
            'results': serializer.data,
            'has_more': notifications_page.has_next(),  # chỗ ni phục vụ chỗ frontend, coi thử có load thêm nữa không
            'total_count': paginator.count,  # khúc ni trả về tổng số thông báo (thực sự là cũng không cần vì đã có has_more rồi)
        })
    
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

class LikedImageViewSet(viewsets.ModelViewSet):
    queryset = LikedImage.objects.all()
    serializer_class = LikedImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Khi user like một ảnh, đảm bảo nó thuộc về user hiện tại"""
        serializer.save(user=self.request.user.userprofile)  
    
    def list(self, request, *args, **kwargs):
        """Lấy danh sách các ảnh mà user đã like, không trả về thông tin LikedImage"""
        user_profile = request.user.userprofile
        liked_images = LikedImage.objects.filter(user=user_profile).values_list('image', flat=True)
        images = Image.objects.filter(id__in=liked_images)
        serializer = ImageSerializer(images, many=True)
        return Response(serializer.data)

class DownloadedImageViewSet(viewsets.ModelViewSet):
    queryset = DownloadedImage.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Khi user tải ảnh về, đảm bảo nó thuộc về user hiện tại"""
        serializer.save(user=self.request.user.userprofile)
    
    def list(self, request, *args, **kwargs):
        """Lấy danh sách các ảnh mà user đã tải về"""
        user_profile = request.user.userprofile
        downloaded_images = DownloadedImage.objects.filter(user=user_profile).values_list('image', flat=True)
        images = Image.objects.filter(id__in=downloaded_images)
        serializer = ImageSerializer(images, many=True)
        return Response(serializer.data)