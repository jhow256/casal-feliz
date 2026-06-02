from rest_framework import serializers
from .models import Photo


class PhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = [
            "id",
            "original_filename",
            "file_url",
            "uploaded_at",
            "uploaded_by",
            "uploaded_by_name",
        ]
        read_only_fields = ["id", "uploaded_at", "uploaded_by", "uploaded_by_name", "file_url"]

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username

    def get_file_url(self, obj):
        request = self.context.get("request")
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class PhotoUploadSerializer(serializers.Serializer):
    """Used only for the upload endpoint — validates the incoming file."""

    file = serializers.ImageField()

    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
    MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    def validate_file(self, value):
        # Validate MIME type via content_type header (Pillow already verified it's an image)
        content_type = getattr(value, "content_type", "")
        if content_type not in self.ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                "Formato de arquivo não suportado. Use JPEG, PNG ou WebP."
            )
        if value.size > self.MAX_SIZE_BYTES:
            raise serializers.ValidationError(
                "Arquivo excede o limite máximo de 10 MB."
            )
        return value
