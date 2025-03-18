from django.contrib.auth.models import AbstractUser
from django.db import models
import os
import uuid

# from django.db.models.signals import m2m_changed
# from django.dispatch import receiver
# from django.core.exceptions import ValidationError

class User(AbstractUser):

    def custom_image_path(self, filename):
        # generate a unique filename using the user's username
        ext = filename.split('.')[-1] # extract the file extension
        new_filename = f"{self.username}_{uuid.uuid4()}.{ext}"
        return os.path.join("profile_pics", new_filename)

    follows = models.ManyToManyField("User", blank=True, related_name="user_followers")
    likes = models.ManyToManyField("Post", blank=True, related_name="post_likers")
    image = models.ImageField(
        blank=False,
        null=True,
        upload_to=custom_image_path,
        default="images/default_image.png")

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "last_login": self.last_login.strftime("%b %d %Y, %I:%M %p") if self.last_login else None,
            "follows_total": self.follows.all().count(),  # Number of users the current user follows
            "followers_total": self.user_followers.all().count(),  # Number of users following the current user
            "profile_picture": self.image.url if self.image else None,
        }

# @receiver(m2m_changed, sender=User.follows.through)
# def prevent_self_follow(sender, instance, action, reverse, pk_set, **kwargs):
#     if action == "pre_add":
#         # If any of the users being followed is the instance itself, raise an error
#         if instance.pk in pk_set:
#             raise ValidationError("You cannot follow yourself.")


class Post(models.Model):
    author = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_posts")
    body = models.TextField(blank=False, null=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ID:{self.id}, Body:{self.body}, ({self.author} on {self.timestamp})"

    def serialize(self, current_user):
        return {
            "id": self.id,
            "author": self.author.username,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes": self.post_likers.all().count(),
            "liked_by_current_user": self.post_likers.filter(id=current_user.id).exists(),
            "comments_count": self.post_comments.all().count(),
            "comments": [comment.serialize() for comment in Comment.objects.filter(post=self).order_by("-timestamp").all()],
        }


class Comment(models.Model):
    author = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_comments")
    post = models.ForeignKey("Post", on_delete=models.CASCADE, related_name="post_comments")
    body = models.TextField(blank=False, null=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.body}, ({self.author} on {self.timestamp})"

    def serialize(self):
        return {
            "id": self.id,
            "author": self.author.username,
            "post_id": self.post.id,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
        }
