from django.urls import path
from .views import MessageListCreateView, MessageLatestView, MessageRevealView, MessageDeleteView

urlpatterns = [
    path("",              MessageListCreateView.as_view(), name="message-list-create"),
    path("latest/",       MessageLatestView.as_view(),     name="message-latest"),
    path("<int:pk>/reveal/", MessageRevealView.as_view(),  name="message-reveal"),
    path("<int:pk>/",     MessageDeleteView.as_view(),     name="message-delete"),
]
