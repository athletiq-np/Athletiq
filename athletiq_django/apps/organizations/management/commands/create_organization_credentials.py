"""
Management command to create test organization credentials.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.organizations.models import Organization
from apps.authentication.models import User
import uuid


class Command(BaseCommand):
    help = 'Create test organization credentials for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test organizations to create (default: 5)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test organizations before creating new ones'
        )

    def handle(self, *args, **options):
        count = options['count']
        clear = options['clear']

        if clear:
            self.stdout.write('Clearing existing test organizations...')
            # Clear test organizations and their users
            test_orgs = Organization.objects.filter(email__contains='testorg')
            test_users = User.objects.filter(email__contains='testorg')
            test_orgs.delete()
            test_users.delete()
            self.stdout.write(self.style.SUCCESS('Existing test organizations cleared.'))

        self.stdout.write(f'Creating {count} test organization credentials...')

        organization_types = ['sports_club', 'academy', 'training_center', 'federation', 'association']
        cities = ['Kathmandu', 'Pokhara', 'Chitwan', 'Biratnagar', 'Dharan']
        provinces = ['Bagmati', 'Gandaki', 'Bagmati', 'Province 1', 'Province 1']

        test_organizations = []

        for i in range(1, count + 1):
            org_type = organization_types[(i-1) % len(organization_types)]
            city = cities[(i-1) % len(cities)]
            province = provinces[(i-1) % len(provinces)]
            
            # Create admin user for organization
            admin_user_data = {
                'username': f'testorg{i}admin',
                'email': f'testorg{i}@athletiq.dev',
                'password': 'Organization123!',
                'first_name': f'Admin{i}',
                'last_name': 'Organization',
                'role': 'organization',
                'user_type': 'organization',
                'is_active': True,
                'is_verified': True,
            }

            organization_data = {
                'name': f'Test {org_type.replace("_", " ").title()} {i}',
                'type': org_type,
                'registration_number': f'REG-{org_type.upper()}-{i:04d}',
                'description': f'Test {org_type.replace("_", " ")} for development and testing purposes.',
                'contact_person': f'Admin {i} Organization',
                'email': f'testorg{i}@athletiq.dev',
                'phone': f'+977980123456{i:02d}',
                'secondary_phone': f'+977981123456{i:02d}',
                'address': f'{i} Test Street, {city}',
                'city': city,
                'province': province,
                'district': city,  # Simplified for testing
                'postal_code': f'4400{i}',
                'status': 'verified',
                'founded_date': '2020-01-01',
                'website': f'https://testorg{i}.athletiq.dev',
                'is_active': True,
                'can_create_tournaments': True,
                'can_register_athletes': True,
            }

            try:
                with transaction.atomic():
                    # Create admin user
                    admin_user = User.objects.create_user(
                        username=f'testorg{i}admin',
                        email=f'testorg{i}@athletiq.dev',
                        password=admin_user_data['password'],
                        first_name=admin_user_data['first_name'],
                        last_name=admin_user_data['last_name'],
                        full_name=f"{admin_user_data['first_name']} {admin_user_data['last_name']}",
                        role='Organization',
                        is_active=admin_user_data['is_active'],
                    )

                    # Create organization
                    organization_data['admin_user'] = admin_user
                    organization = Organization.objects.create(**organization_data)
                    
                    test_organizations.append({
                        'id': organization.id,
                        'name': organization.name,
                        'type': organization.type,
                        'email': organization.email,
                        'phone': organization.phone,
                        'admin_username': admin_user.username,
                        'admin_email': admin_user.email,
                        'password': admin_user_data['password']
                    })

                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created organization: {organization.name} ({organization.email})')
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to create organization {i}: {str(e)}')
                )

        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS('ORGANIZATION TEST CREDENTIALS CREATED'))
        self.stdout.write('='*70)

        for org in test_organizations:
            self.stdout.write(f"""
Organization ID: {org['id']}
Name: {org['name']}
Type: {org['type']}
Email: {org['email']}
Phone: {org['phone']}
Admin Username: {org['admin_username']}
Admin Email: {org['admin_email']}
Password: {org['password']}
Login URL: http://localhost:3000/login
            """)

        self.stdout.write('='*70)
        self.stdout.write(f'Total organizations created: {len(test_organizations)}')
        self.stdout.write('All organizations are verified and ready for login.')
        self.stdout.write('Use these credentials to test the organization portal.')