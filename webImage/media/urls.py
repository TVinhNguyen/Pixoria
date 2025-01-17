from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ImageViewSet, CollectionViewSet, SubscriptionViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'images', ImageViewSet , basename='image')
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'subscriptions', SubscriptionViewSet , basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
