import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone
from PIL import Image

from .models import User, Post, Comment


def user_profile(request, user):

    if request.user.is_authenticated:
        following = request.user.follows.filter(username=user).exists()
    else:
        following = None

    return render(request, "network/user_profile.html", {
        "viewed_user": User.objects.get(username=user).serialize(),
        "following" : following,
    })


@login_required
def create_post(request):

    # Create a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    body = data.get("body", "")
    if body == "":
        return JsonResponse({"error": "Post body cannot be empty."}, status=400)
    author = request.user
    post = Post(
        author=author,
        body=body,
    )
    post.save()
    return JsonResponse({"message": "New post created successfully.",}, status=201)


@login_required
def edit_post(request):

    #Edit post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    body = data.get("body", "")
    post_id = data.get("post_id", "")
    if body == "":
        return JsonResponse({"error": "Post body cannot be empty."}, status=400)

    post = Post.objects.get(id=post_id)
    post.body = body
    post.timestamp = timezone.now()
    post.save()
    return JsonResponse({"message": "Post updated successfully.",
                         "new_timestamp": post.timestamp.strftime("%b %d %Y, %I:%M %p")}, status=201)


@login_required
def like_post(request):

    #Like post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    data = json.loads(request.body)
    post_id = data.get("post_id", "")

    # swith post_id like by current user status in database
    post = Post.objects.get(pk=post_id)
    user = request.user

    if post.post_likers.filter(id=user.id).exists():
        user.likes.remove(post)
        like_status = False
        likes_count = post.post_likers.all().count()
    else:
        post.post_likers.add(user)
        like_status = True
        likes_count = post.post_likers.all().count()

    return JsonResponse({"message": "Post liked/unliked successfully.",
                         "like_status": like_status,
                         "likes_count": likes_count}, status=201)


def posts(request, postbox, user=None):

    page = request.GET.get("page", 1)

    # Filter posts returned based on postbox and/or user
    if user:
        posts = Post.objects.filter(
            author=User.objects.get(username=user)
        )
    elif postbox == "all":
        posts = Post.objects.all()
    elif postbox == "following":
        posts = Post.objects.filter(
            author__in = request.user.follows.all()
        )
    # Return posts in reverse chronological order
    posts = posts.order_by("-timestamp").all()

    # Pagination, posts per page 10
    posts_per_page = 10
    p = Paginator(posts, posts_per_page)
    page_obj = p.page(page)

    return JsonResponse({"posts": [post.serialize(request.user) for post in page_obj],
                         "total_pages": p.num_pages,
                         "current_page": page_obj.number,
                         "has_next": page_obj.has_next(),
                         "has_previous": page_obj.has_previous(),
                         "is_authenticated": request.user.is_authenticated}, safe=False)


@login_required
def post_comment(request):

    # Post comment must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    post_id = data.get("post_id", "")
    comment_body = data.get("comment_body", "")

    if comment_body == "":
        return JsonResponse({"error": "Comment body cannot be empty."}, status=400)

    author = request.user
    post = Post.objects.get(pk=post_id)
    comment = Comment(
        author=author,
        body=comment_body,
        post=post,
    )
    comment.save()
    comments_count = post.post_comments.all().count()
    return JsonResponse({"message": "Comment added successfully.",
                         "comment": comment.serialize(),
                         "comments_count": comments_count}, status=201)


@login_required
def follow(request, action, user_to_follow):

    # Follow/Unfollow request must be via "POST"
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    if action == "follow":
        request.user.follows.add(User.objects.get(username=user_to_follow))
    elif action == "unfollow":
        request.user.follows.remove(User.objects.get(username=user_to_follow))

    return JsonResponse({"count": User.objects.get(username=user_to_follow).user_followers.count()})



ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"]
@login_required
def upload_image(request):
    # Upload request must be via "POST"
    if request.method != "POST":
        return JsonResponse({"error": "POST request required for image upload."}, status=400)

    if "image" not in request.FILES:
        return JsonResponse({"error": "No image uploaded"}, status=400)

    if request.FILES.get('image'):
        image_file = request.FILES['image']

        # Validate Max size 5MB
        max_size = 1024 * 1024 * 5
        if image_file.size > max_size:
            return JsonResponse({"error": "Image file is too large (max 5MB)"}, status=400)
        # Validate MIME Type
        content_type = image_file.content_type
        if content_type not in ALLOWED_IMAGE_TYPES:
            return JsonResponse({"error": "Invalid image type. Only JPG, PNG, GIF and WEBP allowed."}, status=400)
        # Validate File Extension
        ext = image_file.name.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return JsonResponse({"error": "Invalid file extension. Only jpg, jpeg, png, gif and webp allowed."}, status=400)
        # Ensure it is a valid image
        try:
            image = Image.open(image_file)
            image.verify() # Verify file is an actual image
        except (IOError, SyntaxError, ValidationError):
            return JsonResponse({"error": "Corrupt or invalid image file."}, status=400)

        # Save image to User profile
        user = request.user
        user.image = image_file
        user.save()
        return JsonResponse({"message": "Image uploded successfully!",
                             "new_image_url": user.image.url})

    return JsonResponse({"error": "No image uploaded."}, status=400)


def index(request):
    return render(request, "network/index.html")


def following_posts(request):
    return render(request, "network/following_posts.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
