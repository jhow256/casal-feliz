import os
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.image_utils import compress_image
from .models import Event, EventPhoto, EventVideo
from .serializers import EventSerializer, EventPhotoSerializer, EventVideoSerializer

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

        # Filter by date if provided (for calendar day view)
        date_filter = request.query_params.get("date")
        if date_filter:
            qs = qs.filter(date=date_filter)

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
        event.photo = compress_image(photo, filename_hint=photo.name)
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


class EventGalleryView(APIView):
    """
    POST   /api/events/<pk>/gallery/        — add a photo (max 3)
    DELETE /api/events/<pk>/gallery/<gid>/  — remove a specific photo
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        if event.gallery.count() >= 3:
            return Response(
                {"error": "Limite de 3 fotos por evento atingido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        photo = request.FILES.get("photo")
        if not photo:
            return Response({"error": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

        allowed = {"image/jpeg", "image/png", "image/webp"}
        if photo.content_type not in allowed:
            return Response(
                {"error": "Formato não suportado. Use JPEG, PNG ou WebP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ep = EventPhoto.objects.create(event=event, file=compress_image(photo, filename_hint=photo.name))
        return Response(
            EventPhotoSerializer(ep, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, pk, gid):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        ep = get_object_or_404(EventPhoto, pk=gid, event=event)
        if ep.file and os.path.isfile(ep.file.path):
            os.remove(ep.file.path)
        ep.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventVideoView(APIView):
    """
    POST   /api/events/<pk>/videos/        — add a video (max 2)
    DELETE /api/events/<pk>/videos/<vid>/  — remove a specific video
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    ALLOWED_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"}
    MAX_SIZE = 100 * 1024 * 1024  # 100 MB

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        if event.videos.count() >= 2:
            return Response(
                {"error": "Limite de 2 vídeos por evento atingido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        video = request.FILES.get("video")
        if not video:
            return Response({"error": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

        if video.content_type not in self.ALLOWED_TYPES:
            return Response(
                {"error": "Formato não suportado. Use MP4, MOV, WebM ou AVI."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if video.size > self.MAX_SIZE:
            return Response(
                {"error": "Vídeo excede o limite de 100 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ev = EventVideo.objects.create(event=event, file=video)
        return Response(
            EventVideoSerializer(ev, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, pk, vid):
        event = get_object_or_404(Event, pk=pk)
        if event.created_by != request.user:
            return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

        ev = get_object_or_404(EventVideo, pk=vid, event=event)
        if ev.file and os.path.isfile(ev.file.path):
            os.remove(ev.file.path)
        ev.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventDatesView(APIView):
    """
    GET /api/events/dates/?year=2024&month=6
    Returns list of dates that have events (any status).
    Used by the calendar to mark active days.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Event.objects.all()
        year  = request.query_params.get("year")
        month = request.query_params.get("month")
        if year:
            qs = qs.filter(date__year=year)
        if month:
            qs = qs.filter(date__month=month)
        dates = list(qs.values_list("date", flat=True).distinct())
        return Response([str(d) for d in dates])
