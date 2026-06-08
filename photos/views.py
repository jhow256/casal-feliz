import os

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.image_utils import compress_image
from .models import Photo
from .serializers import PhotoSerializer, PhotoUploadSerializer


class PhotoListCreateView(APIView):
    """
    GET  /api/photos/  — list all photos (ordered by upload date asc)
    POST /api/photos/  — upload a new photo
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        photos = Photo.objects.select_related("uploaded_by").all()
        serializer = PhotoSerializer(photos, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        upload_serializer = PhotoUploadSerializer(data=request.data)
        if not upload_serializer.is_valid():
            # Return the first error message in our standard format
            first_error = next(iter(upload_serializer.errors.values()))[0]
            return Response({"error": str(first_error)}, status=status.HTTP_400_BAD_REQUEST)

        file = upload_serializer.validated_data["file"]
        compressed = compress_image(file, filename_hint=file.name)
        photo = Photo.objects.create(
            uploaded_by=request.user,
            original_filename=file.name,
            file=compressed,
        )
        serializer = PhotoSerializer(photo, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PhotoDetailView(APIView):
    """
    GET    /api/photos/<pk>/  — retrieve a single photo
    DELETE /api/photos/<pk>/  — delete a photo (owner only)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        photo = get_object_or_404(Photo, pk=pk)
        serializer = PhotoSerializer(photo, context={"request": request})
        return Response(serializer.data)

    def delete(self, request, pk):
        photo = get_object_or_404(Photo, pk=pk)

        if photo.uploaded_by != request.user:
            return Response(
                {"error": "Você não tem permissão para excluir esta foto."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Remove the file from disk before deleting the DB record
        if photo.file and os.path.isfile(photo.file.path):
            os.remove(photo.file.path)

        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
