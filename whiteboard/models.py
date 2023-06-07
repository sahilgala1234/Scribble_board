from django.db import models
import uuid

class WhiteBoards(models.Model):
    board_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board_image = models.ImageField()
