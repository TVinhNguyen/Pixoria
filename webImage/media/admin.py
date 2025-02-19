from django.contrib import admin


# Register your models here.
from .models import Category, Image, Collection, User
admin.site.register(User)
admin.site.register(Category)
admin.site.register(Image)
admin.site.register(Collection)
#zzzzz