from django.contrib import admin


# Register your models here.
from .models import Category, Image, Collection, Subscription

admin.site.register(Category)
admin.site.register(Image)
admin.site.register(Collection)
admin.site.register(Subscription)
#zzzzz