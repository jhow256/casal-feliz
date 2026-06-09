from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    EventCompleteView,
    EventDuplicateView,
    EventPhotoView,
    EventGalleryView,
    EventVideoView,
    EventDatesView,
)

urlpatterns = [
    path("", EventListCreateView.as_view(), name="event-list-create"),
    path("dates/", EventDatesView.as_view(), name="event-dates"),
    path("<int:pk>/", EventDetailView.as_view(), name="event-detail"),
    path("<int:pk>/complete/", EventCompleteView.as_view(), name="event-complete"),
    path("<int:pk>/duplicate/", EventDuplicateView.as_view(), name="event-duplicate"),
    path("<int:pk>/photo/", EventPhotoView.as_view(), name="event-photo"),
    path("<int:pk>/gallery/", EventGalleryView.as_view(), name="event-gallery-add"),
    path("<int:pk>/gallery/<int:gid>/", EventGalleryView.as_view(), name="event-gallery-delete"),
    path("<int:pk>/videos/", EventVideoView.as_view(), name="event-video-add"),
    path("<int:pk>/videos/<int:vid>/", EventVideoView.as_view(), name="event-video-delete"),
]
