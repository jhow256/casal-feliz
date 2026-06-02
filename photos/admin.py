from django.contrib import admin
from .models import Photo


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display  = ("id", "original_filename", "uploaded_by", "uploaded_at")
    list_filter   = ("uploaded_by",)
    search_fields = ("original_filename", "uploaded_by__username", "uploaded_by__email")
    readonly_fields = ("uploaded_at",)
    ordering      = ("-uploaded_at",)
