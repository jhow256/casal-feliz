from django.db import models
from django.contrib.auth.models import User


def photo_upload_path(instance, filename):
    """Store photos under media/photos/<user_id>/<filename>."""
    return f"photos/{instance.uploaded_by_id}/{filename}"


class Photo(models.Model):
    uploaded_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="photos"
    )
    original_filename = models.CharField(max_length=255)
    file = models.ImageField(upload_to=photo_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"{self.original_filename} ({self.uploaded_by})"
