"""Resources Models — mental health educational content."""
from django.db import models
from django.conf import settings


class ResourceCategory(models.Model):
    name       = models.CharField(max_length=100, unique=True)
    slug       = models.SlugField(max_length=100, unique=True)
    icon       = models.CharField(max_length=10, default='📚')
    color      = models.CharField(max_length=20, default='#EBF3EC')
    order      = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table  = 'mm_resource_categories'
        ordering  = ['order', 'name']
        verbose_name_plural = 'Resource categories'

    def __str__(self):
        return self.name


class Resource(models.Model):
    class ContentType(models.TextChoices):
        ARTICLE = 'article', 'Article'
        VIDEO   = 'video',   'Vidéo'
        PDF     = 'pdf',     'PDF'
        GUIDE   = 'guide',   'Guide'
        AUDIO   = 'audio',   'Audio'

    category     = models.ForeignKey(
        ResourceCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='resources'
    )
    uploaded_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='uploaded_resources'
    )
    title        = models.CharField(max_length=300)
    slug         = models.SlugField(max_length=300, unique=True, blank=True)
    description  = models.TextField()
    content_type = models.CharField(max_length=20, choices=ContentType.choices, default=ContentType.ARTICLE)
    content      = models.TextField(blank=True, help_text='Full article content or transcript')
    file         = models.FileField(upload_to='resources/', null=True, blank=True)
    thumbnail    = models.ImageField(upload_to='resource_thumbs/', null=True, blank=True)
    external_url = models.URLField(blank=True)
    read_time_minutes = models.PositiveSmallIntegerField(default=5)
    is_published = models.BooleanField(default=True)
    is_featured  = models.BooleanField(default=False)
    view_count   = models.PositiveIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mm_resources'
        ordering = ['-is_featured', '-created_at']
        indexes  = [models.Index(fields=['is_published', 'category'])]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(self.title)
            slug = base
            n = 1
            while Resource.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{n}'
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ResourceView(models.Model):
    """Track which users have viewed which resources."""
    resource  = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='views')
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mm_resource_views'
        unique_together = ['resource', 'user']