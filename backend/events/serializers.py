from rest_framework import serializers
from .models import Event, EventPhoto, EventVideo


class EventPhotoSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EventPhoto
        fields = ["id", "file_url", "uploaded_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class EventVideoSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EventVideo
        fields = ["id", "file_url", "uploaded_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class EventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    photo_url       = serializers.SerializerMethodField()
    gallery         = serializers.SerializerMethodField()
    videos          = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "date",
            "time",
            "is_completed",
            "completed_at",
            "rating",
            "completion_note",
            "photo_url",
            "gallery",
            "videos",
            "created_at",
            "updated_at",
            "created_by",
            "created_by_name",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at",
            "created_by", "created_by_name",
            "is_completed", "completed_at",
            "photo_url", "gallery", "videos",
            "rating", "completion_note",
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_photo_url(self, obj):
        request = self.context.get("request")
        if obj.photo:
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None

    def get_gallery(self, obj):
        request = self.context.get("request")
        return EventPhotoSerializer(
            obj.gallery.all(), many=True, context={"request": request}
        ).data

    def get_videos(self, obj):
        request = self.context.get("request")
        return EventVideoSerializer(
            obj.videos.all(), many=True, context={"request": request}
        ).data

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("O título não pode estar em branco.")
        return value
