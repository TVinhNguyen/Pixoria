from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ImageViewSet, CollectionViewSet, UserViewSet,
    RegisterView, LoginView, UserProfileViewSet, 
    CollectionImagesViewSet, ImagesCategoryViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'images', ImageViewSet, basename='image')
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'profile', UserProfileViewSet, basename='userprofile')
router.register(r'collection-images', CollectionImagesViewSet, basename='collection-images')
router.register(r'images-categories', ImagesCategoryViewSet, basename='images-categories')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    
    # Thêm dòng này để hiển thị nút Login trên giao diện DRF
    path('api-auth/', include('rest_framework.urls')),
]
