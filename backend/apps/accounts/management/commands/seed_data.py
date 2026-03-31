from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with sample MindMate data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding MindMate database...")
        self._create_users()
        self._create_categories()
        self._create_resources()
        self._create_cases()
        self.stdout.write("Seeding complete!")

    def _create_users(self):
        from apps.accounts.models import StudentProfile, CounselorProfile

        if not User.objects.filter(email="admin@mindmate.rw").exists():
            User.objects.create_superuser(
                email="admin@mindmate.rw",
                password="password",
                first_name="Admin",
                last_name="MindMate",
                role="admin",
                is_verified=True,
            )
            self.stdout.write("  Admin created")
        else:
            self.stdout.write("  Admin already exists")

        counselors_data = [
            ("jean@mindmate.rw",  "Jean",  "Habimana", "Stress et Anxiete"),
            ("sarah@mindmate.rw", "Sarah", "Mukamana", "Deuil et Trauma"),
            ("peter@mindmate.rw", "Peter", "Uwimana",  "Relations"),
        ]
        for email, fn, ln, specialty in counselors_data:
            if not User.objects.filter(email=email).exists():
                u = User.objects.create_user(
                    email=email,
                    password="password",
                    first_name=fn,
                    last_name=ln,
                    role="counselor",
                    is_verified=True,
                )
                CounselorProfile.objects.create(
                    user=u,
                    specialty=specialty,
                    is_available=True,
                    max_cases=10,
                )
                self.stdout.write("  Counselor " + fn + " " + ln + " created")

        students_data = [
            ("student@mindmate.rw", "Amina",  "Mutoni",     "UR/2024/001", "Informatique", 3),
            ("eric@mindmate.rw",    "Eric",   "Nkurunziza", "UR/2024/002", "Medecine",     1),
            ("claire@mindmate.rw",  "Claire", "Uwimana",    "UR/2023/045", "Droit",        2),
            ("david@mindmate.rw",   "David",  "Mugisha",    "UR/2024/078", "Economie",     1),
            ("aline@mindmate.rw",   "Aline",  "Igiraneza",  "UR/2023/112", "Architecture", 3),
        ]
        for email, fn, ln, sid, dept, year in students_data:
            if not User.objects.filter(email=email).exists():
                u = User.objects.create_user(
                    email=email,
                    password="password",
                    first_name=fn,
                    last_name=ln,
                    role="student",
                    is_verified=True,
                )
                StudentProfile.objects.create(
                    user=u,
                    student_id=sid,
                    department=dept,
                    year_of_study=year,
                )
                self.stdout.write("  Student " + fn + " " + ln + " created")

    def _create_categories(self):
        from apps.resources.models import ResourceCategory

        categories = [
            ("Stress et Anxiete",  "stress-anxiete",     "#EBF3EC", 1),
            ("Bien-etre Mental",   "bien-etre-mental",   "#EBF8FF", 2),
            ("Soins Personnels",   "soins-personnels",   "#F0EBF4", 3),
            ("Bien-etre Social",   "bien-etre-social",   "#FBF5E0", 4),
            ("Soutien Emotionnel", "soutien-emotionnel", "#FAF0EB", 5),
            ("Urgence et Crise",   "urgence-crise",      "#FFF5F5", 6),
        ]
        for name, slug, color, order in categories:
            ResourceCategory.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "color": color,
                    "order": order,
                },
            )
        self.stdout.write("  Resource categories created")

    def _create_resources(self):
        from apps.resources.models import Resource, ResourceCategory

        admin = User.objects.filter(role="admin").first()
        if not admin:
            self.stdout.write("  No admin found, skipping resources")
            return

        cats = list(ResourceCategory.objects.all())

        resources = [
            ("Gerer le Stress Academique",     "stress-academique", "article", 8,  True),
            ("Meditation de Pleine Conscience", "meditation-pleine", "guide",   5,  True),
            ("Conseils Hygiene du Sommeil",     "hygiene-sommeil",   "article", 6,  False),
            ("Construire des Relations Saines", "relations-saines",  "article", 10, False),
            ("Faire Face au Deuil",             "deuil-perte",       "article", 12, False),
            ("Ressources de Crise",             "ressources-crise",  "guide",   3,  True),
        ]
        for i, (title, slug, ctype, read_time, featured) in enumerate(resources):
            if not Resource.objects.filter(slug=slug).exists():
                Resource.objects.create(
                    title=title,
                    slug=slug,
                    description="Ressource sur: " + title,
                    content_type=ctype,
                    read_time_minutes=read_time,
                    is_featured=featured,
                    is_published=True,
                    uploaded_by=admin,
                    category=cats[i % len(cats)] if cats else None,
                    content="Contenu de la ressource: " + title,
                )
        self.stdout.write("  Resources created")

    def _create_cases(self):
        from apps.cases.models import SupportCase, CaseNote, CaseActivity
        from apps.messages_app.models import Conversation, Message

        student = User.objects.filter(email="student@mindmate.rw").first()
        counselor = User.objects.filter(email="jean@mindmate.rw").first()

        if not student or not counselor:
            self