from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ("id", "author", "content", "created_at", "revealed_by", "revealed_at")
    list_filter   = ("author",)
    search_fields = ("content",)
    readonly_fields = ("created_at", "revealed_at")
