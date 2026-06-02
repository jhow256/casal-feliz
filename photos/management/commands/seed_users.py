"""
Management command to create the two couple users.

Usage:
    python manage.py seed_users
    python manage.py seed_users --user1-email joao@casal.com --user1-pass 123456 \
                                --user2-email maria@casal.com --user2-pass 123456
"""

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Cria os dois usuários do casal para uso inicial da aplicação."

    def add_arguments(self, parser):
        parser.add_argument("--user1-email", default="joao@casal.com")
        parser.add_argument("--user1-name", default="João")
        parser.add_argument("--user1-pass", default="casal@2024")
        parser.add_argument("--user2-email", default="parceiro@casal.com")
        parser.add_argument("--user2-name", default="Parceiro(a)")
        parser.add_argument("--user2-pass", default="casal@2024")

    def handle(self, *args, **options):
        for i in (1, 2):
            email = options[f"user{i}_email"]
            name = options[f"user{i}_name"]
            password = options[f"user{i}_pass"]
            username = email.split("@")[0]

            if User.objects.filter(email=email).exists():
                self.stdout.write(self.style.WARNING(f"Usuário {email} já existe, pulando."))
                continue

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=name,
            )
            self.stdout.write(
                self.style.SUCCESS(f"Usuário criado: {user.email} (username: {user.username})")
            )
