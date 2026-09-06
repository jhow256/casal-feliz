from rest_framework import serializers
from .models import Message


class MessageWriteSerializer(serializers.Serializer):
    """Used only for POST — accepts the content field."""
    content = serializers.CharField(max_length=1000, allow_blank=False)


class MessageSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_id   = serializers.SerializerMethodField()
    is_revealed = serializers.SerializerMethodField()
    content     = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id", "content", "author_name", "author_id",
            "created_at", "is_revealed", "revealed_at",
        ]
        read_only_fields = [
            "id", "author_name", "author_id",
            "created_at", "is_revealed", "revealed_at", "content",
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_author_id(self, obj):
        return obj.author_id

    def get_is_revealed(self, obj):
        return obj.revealed_by_id is not None

    def get_content(self, obj):
        request = self.context.get("request")
        if not request:
            return obj.content
        user = request.user
        if obj.author_id == user.id:
            return obj.content
        if obj.revealed_by_id is not None:
            return obj.content
        return None
