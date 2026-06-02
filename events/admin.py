from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display  = ("id", "title", "date", "created_by", "created_at")
    list_filter   = ("created_by", "date")
    search_fields = ("title", "description", "created_by__username", "created_by__email")
    readonly_fields = ("created_at", "updated_at")
    ordering      = ("date",)
