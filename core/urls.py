from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("core.auth_urls")),
    path("api/photos/", include("photos.urls")),
    path("api/events/", include("events.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
