# Generated by Django 5.1.5 on 2025-02-04 13:48

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("network", "0006_alter_comment_body_alter_post_body"),
    ]

    operations = [
        migrations.AlterField(
            model_name="comment",
            name="body",
            field=models.TextField(
                validators=[django.core.validators.MinLengthValidator(1)]
            ),
        ),
        migrations.AlterField(
            model_name="post",
            name="body",
            field=models.TextField(
                validators=[django.core.validators.MinLengthValidator(1)]
            ),
        ),
    ]
