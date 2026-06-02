from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    EventCompleteView,
    EventDuplicateView,
    EventPhotoView,
)

urlpatterns = [
    path("", EventListCreateView.as_view(), name="event-list-create"),
    path("<int:pk>/", EventDetailView.as_view(), name="event-detail"),
    path("<int:pk>/complete/", EventCompleteView.as_view(), name="event-complete"),
    path("<int:pk>/duplicate/", EventDuplicateView.as_view(), name="event-duplicate"),
    path("<int:pk>/photo/", EventPhotoView.as_view(), name="event-photo"),
]
