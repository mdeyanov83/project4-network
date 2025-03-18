from django.contrib import admin

from .models import User, Post, Comment

# Register your models here.

class UserFollowsInline(admin.TabularInline):
    model = User.follows.through
    fields = ("from_user",)
    extra = 0
    verbose_name = "Follower"
    verbose_name_plural = "Followers"
    fk_name = "to_user"


class UserAdmin(admin.ModelAdmin):
    inlines = (UserFollowsInline,)
    filter_horizontal = ("follows", "likes")
    list_display = ("id", "username")
    readonly_fields = ("id",)


class UserLikesInline(admin.TabularInline):
    model = User.likes.through
    fields = ("user",)
    extra = 0
    verbose_name = "User who liked this post"
    verbose_name_plural = "Users who liked this post"


class PostAdmin(admin.ModelAdmin):
    inlines = (UserLikesInline,)
    list_display = ("id", "author", "body", "timestamp")


class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post_id", "author", "body", "timestamp")


admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Comment, CommentAdmin)
