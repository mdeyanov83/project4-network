from django.urls import path
from . import views

from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path("", views.index, name="index"),
    path("following_posts", views.following_posts, name="following_posts"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("user_profile/<str:user>", views.user_profile, name="user_profile"),

    # API Routes
    path("create_post", views.create_post, name="create_post"),

    path("posts/<str:postbox>/", views.posts, name="posts"),
    path("posts/<str:postbox>/<str:user>/", views.posts, name="user_posts"),

    path("follow/<str:action>/<str:user_to_follow>", views.follow, name="follow"),
    path("edit_post", views.edit_post, name="edit_post"),
    path("like_post", views.like_post, name="like_post"),
    path("post_comment", views.post_comment, name="post_comment"),

    path("upload_image", views.upload_image, name="upload_image"),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
