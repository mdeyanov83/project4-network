# Generated by Django 5.1.5 on 2025-02-06 23:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("network", "0008_alter_comment_body_alter_post_body"),
    ]

    operations = [
        migrations.RenameField(
            model_name="comment",
            old_name="post_id",
            new_name="post",
        ),
    ]
