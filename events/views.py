import os
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event
from .serializers import EventSerializer

PAGE_SIZE = 10


class EventListCreateView(APIView):
    """
    GET  /api/events/?completed=false  — active events
    POST /api/events/                  — create event
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        completed = request.query_params.get("completed", "false").lower() == "true"
        qs = (
            Event.objects
            .select_related("created_by")
            .filter(is_completed=completed)
            .order_by("date")
        )

        if completed:
            # pagination for completed events
            try:
                page = max(1, int(request.query_params.get("page", 1)))
            except ValueError:
                page = 1
            total = qs.count()
            total_pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
            page = min(page, total_pages)
            start = (page - 1) * PAGE_SIZE
            qs = qs[start: start + PAGE_SIZE]
            serializer = EventSerializer(qs, many=True, context={"request": request})
            return Response({
                "results": serializer.data,
                "page": page,
                "total_pages": total_pages,
                "total": total,
            })

        serializer = EventSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = EventSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    """
    GET    /api/events/<pk>/
    PATCH  /api/events/<pk>/
    DELETE /api/events/<pk>/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        return Response(EventSerializer(event, context={"request": request}).data)

    def patch(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response(
                {"error": "Você não tem permissão para editar este evento."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = EventSerializer(
            event, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response(
                {"error": "Você não tem permissão para excluir este evento."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if event.photo and os.path.isfile(event.photo.path):
            os.remove(event.photo.path)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventCompleteView(APIView):
    """
    POST /api/events/<pk>/complete/  — mark as completed (toggle)
    Body (optional): { "rating": 1-5, "completion_note": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response(
                {"error": "Você não tem permissão para concluir este evento."},
                status=status.HTTP_403_FORBIDDEN,
            )
        event.is_completed = not event.is_completed
        event.completed_at = timezone.now() if event.is_completed else None

        if event.is_completed:
            rating = request.data.get("rating")
            if rating is not None:
                try:
                    rating = int(rating)
                    if 1 <= rating <= 5:
                        event.rating = rating
                except (ValueError, TypeError):
                    pass
            event.completion_note = request.data.get("completion_note", "")
        else:
            # Undo — clear rating and note
            event.rating = None
            event.completion_note = ""

        event.save()
        return Response(EventSerializer(event, context={"request": request}).data)


class EventDuplicateView(APIView):
    """
    POST /api/events/<pk>/duplicate/  — clone event for current user
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        original = get_object_or_404(Event, pk=pk)
        clone = Event.objects.create(
            created_by=request.user,
            title=f"{original.title} (cópia)",
            description=original.description,
            date=original.date,
        )
        return Response(
            EventSerializer(clone, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class EventPhotoView(APIView):
    """
    POST   /api/events/<pk>/photo/  — upload or replace photo
    DELETE /api/events/<pk>/photo/  — remove photo
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response(
                {"error": "Você não tem permissão para editar este evento."},
                status=status.HTTP_403_FORBIDDEN,
            )
        photo = request.FILES.get("photo")
        if not photo:
            return Response(
                {"error": "Nenhum arquivo enviado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        allowed = {"image/jpeg", "image/png", "image/webp"}
        if photo.content_type not in allowed:
            return Response(
                {"error": "Formato não suportado. Use JPEG, PNG ou WebP."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Remove old file if exists
        if event.photo and os.path.isfile(event.photo.path):
            os.remove(event.photo.path)
        event.photo = photo
        event.save()
        return Response(EventSerializer(event, context={"request": request}).data)

    def delete(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response(
                {"error": "Você não tem permissão para editar este evento."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if event.photo and os.path.isfile(event.photo.path):
            os.remove(event.photo.path)
        event.photo = None
        event.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
