from django.db import models


class Note(models.Model):
    text = models.TextField(default='')
    x = models.FloatField()
    y = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
