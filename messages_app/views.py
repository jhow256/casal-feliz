from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Message
from .serializers import MessageSerializer, MessageWriteSerializer


class MessageListCreateView(APIView):
    """
    GET  /api/messages/        — list all messages (newest first)
    POST /api/messages/        — create a new message
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        # Each user sees:
        # 1. Messages they authored (always)
        # 2. Messages written by others that THEY revealed
        qs = Message.objects.select_related("author", "revealed_by").filter(
            Q(author=request.user) |
            Q(revealed_by=request.user)
        ).order_by("-created_at")
        return Response(MessageSerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        write = MessageWriteSerializer(data=request.data)
        if not write.is_valid():
            return Response(write.errors, status=status.HTTP_400_BAD_REQUEST)
        instance = Message.objects.create(
            author=request.user,
            content=write.validated_data['content'],
        )
        out = MessageSerializer(
            Message.objects.select_related("author", "revealed_by").get(pk=instance.pk),
            context={"request": request}
        )
        return Response(out.data, status=status.HTTP_201_CREATED)


class MessageLatestView(APIView):
    """
    GET /api/messages/latest/  — most recent unrevealed message
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        msg = (
            Message.objects
            .filter(revealed_by__isnull=True)
            .exclude(author=request.user)   # the OTHER person reveals
            .order_by("-created_at")
            .first()
        )
        if not msg:
            # Fallback: latest regardless
            msg = Message.objects.order_by("-created_at").first()
        if not msg:
            return Response(None)
        return Response(MessageSerializer(msg, context={"request": request}).data)


class MessageRevealView(APIView):
    """
    POST /api/messages/<pk>/reveal/  — mark as revealed
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        msg = get_object_or_404(Message, pk=pk)
        if not msg.revealed_by:
            msg.revealed_by = request.user
            msg.revealed_at = timezone.now()
            msg.save()
        return Response(MessageSerializer(msg, context={"request": request}).data)


class MessageDeleteView(APIView):
    """
    DELETE /api/messages/<pk>/  — delete own message
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        msg = get_object_or_404(Message, pk=pk)
        if msg.author != request.user:
            return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)
        msg.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
