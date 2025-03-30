from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv
import mimetypes
import dj_database_url

load_dotenv()

# Base directory

BASE_DIR = Path(__file__).resolve().parent.parent

# Secret key (Không dùng key này trong production!)
SECRET_KEY = 'django-insecure-87n-v531cd3*ua0qn-4-2f!c)h$p8=nq!bd3obbp+dg%o-9wv('

# Debug mode (Tắt khi deploy)
DEBUG = True

# Allowed hosts (Thêm domain khi deploy)
ALLOWED_HOSTS = ['*']

# Installed apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'storages',
    'corsheaders',
    # Local apps
    'media',
    'imageretrieval',
    'clip',
    # For request to server (pip install django-cors-headers)
    

]

# Middleware
MIDDLEWARE = [
    # The first is to allow to fetch data
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Allow frontend to fetch data from backend
CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_CREDENTIALS = True

# URL configuration
ROOT_URLCONF = 'webImage.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI application
WSGI_APPLICATION = 'webImage.wsgi.application'

# Database (PostgreSQL)

DATABASES = {
    'default': dj_database_url.config(conn_max_age=600, ssl_require=True)
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',  # Thêm dòng này để hiển thị nút Login
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',  # Chuyển về PageNumberPagination
    'PAGE_SIZE': 12,
}


MEDIA_ROOT = BASE_DIR / 'mediafiles'
MEDIA_URL = '/mediafiles/'
INDEX_DIR = MEDIA_ROOT / "image_index"
INDEX_CLIP_DIR = MEDIA_ROOT / "clip_index"
# Simple JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

mimetypes.add_type("image/jpeg", ".mpo", strict=True)

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# AWS S3 Storage settings
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', 'your-access-key')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', 'your-secret-key')

AWS_STORAGE_BUCKET_NAME = 'photostv'
AWS_S3_REGION_NAME = 'ap-southeast-2'
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = False

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]
