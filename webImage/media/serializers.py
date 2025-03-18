from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Image, Category, Collection, UserProfile, ImageCategory, Notification , Follow
from django.utils.timesince import timesince
from .image_search import ImageSearch

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},  
        }

    def update(self, instance, validated_data):
        """Xử lý cập nhật User (bao gồm đổi mật khẩu nếu có)"""
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password) 
        return super().update(instance, validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user)
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ImageSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Image
        fields = '__all__'

    def validate(self, data):
        if 'file' in data:
            if data['file'].size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Ảnh không được lớn hơn 5MB!")
        return data

class ImageSearchSerializer(serializers.Serializer):
    """Serializer cho việc tìm kiếm ảnh tương tự"""
    image_file = serializers.ImageField(required=False)
    image_url = serializers.URLField(required=False)
    top_k = serializers.IntegerField(default=10, min_value=1, max_value=100)
    
    def validate(self, data):
        """Đảm bảo có một trong hai: image_file hoặc image_url"""
        if 'image_file' not in data and 'image_url' not in data:
            raise serializers.ValidationError(
                "Phải cung cấp image_file hoặc image_url"
            )
        
        if 'image_file' in data:
            if data['image_file'].size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Ảnh không được lớn hơn 5MB!")
                
        return data

class SimilarImageResultSerializer(serializers.ModelSerializer):
    """Serializer cho kết quả tìm kiếm ảnh tương tự"""
    distance = serializers.FloatField(read_only=True)
    similarity = serializers.SerializerMethodField()
    
    class Meta:
        model = Image
        fields = ('id', 'file', 'title', 'description', 'created_at', 
                 'user', 'likes', 'is_public', 'distance', 'similarity')
    
    def get_similarity(self, obj):
        """Tính điểm tương đồng từ khoảng cách"""
        if 'distance' in obj:
            # Chuyển đổi khoảng cách sang điểm tương đồng (0-100%)
            # Giả sử khoảng cách max = 2.0 (có thể điều chỉnh)
            max_distance = 2.0
            similarity = max(0, (1 - obj['distance'] / max_distance)) * 100
            return round(similarity, 2)
        return 0
class CollectionSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.user.username', read_only=True)  
    images = serializers.PrimaryKeyRelatedField(
        queryset=Image.objects.all(), many=True, required=False
    )  # Cho phép danh sách ID của images, không bắt buộc

    class Meta:
        model = Collection
        fields = ['id', 'user', 'name', 'description', 'images', 'is_public', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate_images(self, value):
        """Chặn người dùng thêm ảnh không phải của họ vào bộ sưu tập riêng tư"""
        user_profile = self.context['request'].user.userprofile
        for image in value:
            if not image.is_public and image.user != user_profile:
                raise serializers.ValidationError("Bạn không thể thêm ảnh riêng tư của người khác vào bộ sưu tập.")
        return value

class UserProfileMinSerializer(serializers.ModelSerializer):
    """Simple serializer for UserProfile in Follow relationships"""
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user_id', 'username', 'avatar']  # Adjust fields as needed for your UserProfile

class FollowSerializer(serializers.ModelSerializer):
    """Serializer for Follow model"""
    follower_details = UserProfileMinSerializer(source='follower', read_only=True)
    following_details = UserProfileMinSerializer(source='following', read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at', 'follower_details', 'following_details']
        read_only_fields = ['created_at']
class NotificationSerializer(serializers.ModelSerializer):

    user = serializers.CharField(source='sender.user.username', read_only=True)
    userAvatar = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    read = serializers.BooleanField(source='is_read', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'type', 'user', 'userAvatar', 'content', 'time', 'read']
        read_only_fields = ['id', 'type', 'user', 'userAvatar', 'content', 'time']

    def get_userAvatar(self, obj):
        """Trả về URL avatar của người gửi thông báo"""
        if obj.sender and hasattr(obj.sender, 'avatar') and obj.sender.avatar:
            return obj.sender.avatar.url
        return None  # hoặc URL ảnh mặc định

    def get_time(self, obj):
        """Trả về thời gian dạng tương đối (ví dụ: '5 minutes ago')"""
        return timesince(obj.sent_at) + " ago"

class ImagesCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_title = serializers.CharField(source='image.title', read_only=True)
    
    class Meta:
        model = ImageCategory
        fields = ['id', 'image', 'category', 'category_name', 'image_title']