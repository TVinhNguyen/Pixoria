from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CategoryViewSet, ImageViewSet, CollectionViewSet, UserViewSet,
    RegisterView, UserProfileViewSet, DownloadedImageViewSet,
    ImagesCategoryViewSet, NotificationViewSet, FollowViewSet, ImageSearchViewSet, LikedImageViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'images', ImageViewSet, basename='image')
# Nếu bạn muốn giữ endpoint mặc định cho collection của người dùng hiện tại, vẫn có thể đăng ký:
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'profile', UserProfileViewSet, basename='userprofile')
router.register(r'images-categories', ImagesCategoryViewSet, basename='images-categories')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'follows', FollowViewSet, basename='follow')
router.register(r'image-search', ImageSearchViewSet, basename='image-search')
router.register(r'liked-image', LikedImageViewSet, basename='liked-image')
router.register(r'downloaded-image', DownloadedImageViewSet, basename='downloaded-image')

urlpatterns = [
    path('', include(router.urls)),

    path('profile/<str:username>/collections/', 
         CollectionViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='profile-collections'),

    path('profile/<str:username>/collections/<int:pk>/', 
        CollectionViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
        name='profile-collection-detail'),
        
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('api/login/', TokenObtainPairView.as_view(), name='login'),
    
    # Thêm dòng này để hiển thị nút Login trên giao diện DRF
    path('api-auth/', include('rest_framework.urls')),

    # API token authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
]
