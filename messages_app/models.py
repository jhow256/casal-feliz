from django.db import models
from django.contrib.auth.models import User


class Message(models.Model):
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="messages"
    )
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    # Once revealed, we store who revealed and when
    revealed_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="revealed_messages"
    )
    revealed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author.username}: {self.content[:40]}"
