from django.db import models
from django.contrib.auth.models import User


def event_photo_path(instance, filename):
    return f"events/{instance.id}/{filename}"


def event_gallery_path(instance, filename):
    return f"events/{instance.event_id}/gallery/{filename}"


def event_video_path(instance, filename):
    return f"events/{instance.event_id}/videos/{filename}"


class Event(models.Model):
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="events"
    )
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=500, blank=True, default="")
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    photo = models.ImageField(upload_to=event_photo_path, null=True, blank=True)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    completion_note = models.TextField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date"]

    def __str__(self):
        return f"{self.title} ({self.date})"


class EventPhoto(models.Model):
    """Up to 3 photos per event (registro de fotos)."""
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="gallery"
    )
    file = models.ImageField(upload_to=event_gallery_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]


class EventVideo(models.Model):
    """Up to 2 videos per event."""
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="videos"
    )
    file = models.FileField(upload_to=event_video_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]
