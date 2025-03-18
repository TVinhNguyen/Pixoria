from django.apps import AppConfig

class MediaConfig(AppConfig):  # Thay 'Media' bằng tên app của bạn
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'media'  # Thay 'media' bằng tên app của bạn

    def ready(self):
        import media.signals  # Thay 'media' bằng tên app của bạn