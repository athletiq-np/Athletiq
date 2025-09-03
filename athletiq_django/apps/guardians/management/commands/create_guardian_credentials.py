"""
Management command to create test guardian credentials.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.guardians.models import Guardian
from apps.authentication.models import User
import bcrypt


class Command(BaseCommand):
    help = 'Create test guardian credentials for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test guardians to create (default: 5)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test guardians before creating new ones'
        )

    def handle(self, *args, **options):
        count = options['count']
        clear = options['clear']

        if clear:
            self.stdout.write('Clearing existing test guardians...')
            Guardian.objects.filter(email__contains='testguardian').delete()
            self.stdout.write(self.style.SUCCESS('Existing test guardians cleared.'))

        self.stdout.write(f'Creating {count} test guardian credentials...')

        test_guardians = []

        for i in range(1, count + 1):
            guardian_data = {
                'full_name': f'Test Guardian {i}',
                'email': f'testguardian{i}@athletiq.dev',
                'phone': f'+977984123456{i:02d}',
                'verification_status': 'verified',
                'email_verified': True,
                'phone_verified': True,
                'is_active': True,
            }

            try:
                with transaction.atomic():
                    guardian = Guardian.objects.create(**guardian_data)
                    guardian.set_password('Guardian123!')
                    guardian.save()
                    
                    test_guardians.append({
                        'id': guardian.guardian_id,
                        'name': guardian.full_name,
                        'email': guardian.email,
                        'phone': guardian.phone,
                        'password': 'Guardian123!'
                    })

                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created guardian: {guardian.full_name} ({guardian.email})')
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to create guardian {i}: {str(e)}')
                )

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('GUARDIAN TEST CREDENTIALS CREATED'))
        self.stdout.write('='*60)

        for guardian in test_guardians:
            self.stdout.write(f"""
Guardian ID: {guardian['id']}
Name: {guardian['name']}
Email: {guardian['email']}
Phone: {guardian['phone']}
Password: {guardian['password']}
Login URL: http://localhost:3000/guardian/login
            """)

        self.stdout.write('='*60)
        self.stdout.write(f'Total guardians created: {len(test_guardians)}')
        self.stdout.write('All guardians are verified and ready for login.')
        self.stdout.write('Use these credentials to test the guardian portal.')