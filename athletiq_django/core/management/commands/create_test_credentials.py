"""
Management command to create comprehensive test credentials for all user types.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.guardians.models import Guardian
from apps.organizations.models import Organization
from apps.schools.models import School
from apps.authentication.models import User
import uuid
import random


class Command(BaseCommand):
    help = 'Create comprehensive test credentials for all user types'

    def add_arguments(self, parser):
        parser.add_argument(
            '--guardians',
            type=int,
            default=3,
            help='Number of test guardians to create (default: 3)'
        )
        parser.add_argument(
            '--organizations',
            type=int,
            default=3,
            help='Number of test organizations to create (default: 3)'
        )
        parser.add_argument(
            '--schools',
            type=int,
            default=2,
            help='Number of test schools to create (default: 2)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test data before creating new ones'
        )

    def handle(self, *args, **options):
        guardians_count = options['guardians']
        organizations_count = options['organizations']
        schools_count = options['schools']
        clear = options['clear']

        if clear:
            self.clear_test_data()

        self.stdout.write(self.style.SUCCESS('Creating comprehensive test credentials...'))
        
        # Store all created credentials
        all_credentials = {
            'guardians': [],
            'organizations': [],
            'schools': [],
            'superadmins': []
        }

        # Create test guardians
        if guardians_count > 0:
            all_credentials['guardians'] = self.create_test_guardians(guardians_count)

        # Create test organizations
        if organizations_count > 0:
            all_credentials['organizations'] = self.create_test_organizations(organizations_count)

        # Create test schools
        if schools_count > 0:
            all_credentials['schools'] = self.create_test_schools(schools_count)

        # Create superadmin if not exists
        all_credentials['superadmins'] = self.create_superadmin()

        # Display all credentials
        self.display_credentials(all_credentials)

    def clear_test_data(self):
        """Clear existing test data."""
        self.stdout.write('Clearing existing test data...')
        
        # Clear test guardians
        Guardian.objects.filter(email__contains='testguardian').delete()
        
        # Clear test organizations
        test_orgs = Organization.objects.filter(email__contains='testorg')
        test_org_users = User.objects.filter(email__contains='testorg')
        test_orgs.delete()
        test_org_users.delete()
        
        # Clear test schools
        test_schools = School.objects.filter(email__contains='testschool')
        test_school_users = User.objects.filter(email__contains='testschool')
        test_schools.delete()
        test_school_users.delete()
        
        self.stdout.write(self.style.SUCCESS('Test data cleared.'))

    def create_test_guardians(self, count):
        """Create test guardians."""
        self.stdout.write(f'Creating {count} test guardians...')
        
        guardians = []
        for i in range(1, count + 1):
            guardian_data = {
                'full_name': f'Guardian {i} Test',
                'email': f'testguardian{i}@athletiq.dev',
                'phone': f'+977984{i:03d}567{i:02d}',
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
                    
                    guardians.append({
                        'id': guardian.guardian_id,
                        'name': guardian.full_name,
                        'email': guardian.email,
                        'phone': guardian.phone,
                        'password': 'Guardian123!',
                        'type': 'guardian'
                    })

                self.stdout.write(f'✓ Created guardian: {guardian.full_name}')

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Failed to create guardian {i}: {str(e)}'))

        return guardians

    def create_test_organizations(self, count):
        """Create test organizations."""
        self.stdout.write(f'Creating {count} test organizations...')
        
        organization_types = ['sports_club', 'academy', 'training_center', 'federation', 'association']
        cities = ['Kathmandu', 'Pokhara', 'Chitwan', 'Biratnagar', 'Dharan']
        provinces = ['Bagmati', 'Gandaki', 'Bagmati', 'Province 1', 'Province 1']

        organizations = []
        for i in range(1, count + 1):
            org_type = organization_types[(i-1) % len(organization_types)]
            city = cities[(i-1) % len(cities)]
            province = provinces[(i-1) % len(provinces)]
            
            try:
                with transaction.atomic():
                    # Create admin user
                    admin_user = User.objects.create_user(
                        username=f'testorg{i}admin',
                        email=f'testorg{i}@athletiq.dev',
                        password='Organization123!',
                        first_name=f'Org{i}',
                        last_name='Admin',
                        full_name=f'Org{i} Admin',
                        role='Organization',
                        is_active=True,
                    )

                    # Create organization
                    organization = Organization.objects.create(
                        name=f'Test {org_type.replace("_", " ").title()} {i}',
                        type=org_type,
                        registration_number=f'REG-{org_type.upper()}-{i:04d}',
                        description=f'Test {org_type.replace("_", " ")} for development.',
                        contact_person=f'Admin {i} Organization',
                        email=f'testorg{i}@athletiq.dev',
                        phone=f'+977980{i:03d}567{i:02d}',
                        secondary_phone=f'+977981{i:03d}567{i:02d}',
                        address=f'{i} Test Street, {city}',
                        city=city,
                        province=province,
                        district=city,
                        postal_code=f'4400{i}',
                        status='verified',
                        founded_date='2020-01-01',
                        website=f'https://testorg{i}.athletiq.dev',
                        admin_user=admin_user,
                        is_active=True,
                        can_create_tournaments=True,
                        can_register_athletes=True,
                    )
                    
                    organizations.append({
                        'id': organization.id,
                        'name': organization.name,
                        'type': organization.type,
                        'email': organization.email,
                        'phone': organization.phone,
                        'username': admin_user.username,
                        'password': 'Organization123!',
                        'user_type': 'organization'
                    })

                self.stdout.write(f'✓ Created organization: {organization.name}')

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Failed to create organization {i}: {str(e)}'))

        return organizations

    def create_test_schools(self, count):
        """Create test schools."""
        self.stdout.write(f'Creating {count} test schools...')
        
        school_types = ['public', 'private', 'government']
        cities = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar']

        schools = []
        for i in range(1, count + 1):
            school_type = school_types[(i-1) % len(school_types)]
            city = cities[(i-1) % len(cities)]
            
            try:
                with transaction.atomic():
                    # Create admin user
                    admin_user = User.objects.create_user(
                        username=f'testschool{i}admin',
                        email=f'testschool{i}@athletiq.dev',
                        password='School123!',
                        first_name=f'School{i}',
                        last_name='Admin',
                        full_name=f'School{i} Admin',
                        role='SchoolAdmin',
                        is_active=True,
                    )

                    # Create school
                    school = School.objects.create(
                        name=f'Test {school_type.title()} School {i}',
                        registration_number=f'SCH-{school_type.upper()}-{i:04d}',
                        email=f'testschool{i}@athletiq.dev',
                        phone=f'+977982{i:03d}567{i:02d}',
                        address=f'{i} School Road, {city}',
                        city=city,
                        district=city,
                        province='Bagmati',
                        postal_code=f'4410{i}',
                        school_type=school_type,
                        principal_name=f'Principal {i}',
                        principal_email=f'principal{i}@testschool{i}.edu.np',
                        principal_phone=f'+977983{i:03d}567{i:02d}',
                        established_date='2010-01-01',
                        admin_user=admin_user,
                        is_active=True,
                        verification_status='verified',
                    )
                    
                    schools.append({
                        'id': school.id,
                        'name': school.name,
                        'type': school.school_type,
                        'email': school.email,
                        'phone': school.phone,
                        'username': admin_user.username,
                        'password': 'School123!',
                        'user_type': 'school'
                    })

                self.stdout.write(f'✓ Created school: {school.name}')

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Failed to create school {i}: {str(e)}'))

        return schools

    def create_superadmin(self):
        """Create superadmin user if not exists."""
        superadmins = []
        
        try:
            # Check if superadmin already exists
            if not User.objects.filter(username='superadmin').exists():
                superadmin = User.objects.create_superuser(
                    username='superadmin',
                    email='superadmin@athletiq.dev',
                    password='SuperAdmin123!',
                    first_name='Super',
                    last_name='Admin',
                    full_name='Super Admin',
                    role='SuperAdmin'
                )
                
                superadmins.append({
                    'id': superadmin.id,
                    'name': f'{superadmin.first_name} {superadmin.last_name}',
                    'username': superadmin.username,
                    'email': superadmin.email,
                    'password': 'SuperAdmin123!',
                    'user_type': 'super-admin'
                })
                
                self.stdout.write(f'✓ Created superadmin: {superadmin.username}')
            else:
                superadmin = User.objects.get(username='superadmin')
                superadmins.append({
                    'id': superadmin.id,
                    'name': f'{superadmin.first_name} {superadmin.last_name}',
                    'username': superadmin.username,
                    'email': superadmin.email,
                    'password': 'SuperAdmin123! (existing)',
                    'user_type': 'super-admin'
                })
                self.stdout.write(f'✓ Superadmin already exists: {superadmin.username}')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Failed to create superadmin: {str(e)}'))

        return superadmins

    def display_credentials(self, all_credentials):
        """Display all created credentials."""
        self.stdout.write('\n' + '='*80)
        self.stdout.write(self.style.SUCCESS('🎉 ATHLETIQ TEST CREDENTIALS CREATED'))
        self.stdout.write('='*80)

        # Display Superadmins
        if all_credentials['superadmins']:
            self.stdout.write(self.style.SUCCESS('\n👑 SUPER ADMIN CREDENTIALS:'))
            self.stdout.write('-' * 50)
            for admin in all_credentials['superadmins']:
                self.stdout.write(f"""
Username: {admin['username']}
Email: {admin['email']}
Password: {admin['password']}
Access: Full system administration
Login URL: http://localhost:3000/login
                """)

        # Display Organizations
        if all_credentials['organizations']:
            self.stdout.write(self.style.SUCCESS('\n🏢 ORGANIZATION CREDENTIALS:'))
            self.stdout.write('-' * 50)
            for org in all_credentials['organizations']:
                self.stdout.write(f"""
Organization: {org['name']} ({org['type']})
Email: {org['email']}
Username: {org['username']}
Password: {org['password']}
Phone: {org['phone']}
Access: Organization management, tournaments, athletes
Login URL: http://localhost:3000/login
                """)

        # Display Schools
        if all_credentials['schools']:
            self.stdout.write(self.style.SUCCESS('\n🏫 SCHOOL CREDENTIALS:'))
            self.stdout.write('-' * 50)
            for school in all_credentials['schools']:
                self.stdout.write(f"""
School: {school['name']} ({school['type']})
Email: {school['email']}
Username: {school['username']}
Password: {school['password']}
Phone: {school['phone']}
Access: School management, athletes, tournaments
Login URL: http://localhost:3000/login
                """)

        # Display Guardians
        if all_credentials['guardians']:
            self.stdout.write(self.style.SUCCESS('\n👨‍👩‍👧‍👦 GUARDIAN CREDENTIALS:'))
            self.stdout.write('-' * 50)
            for guardian in all_credentials['guardians']:
                self.stdout.write(f"""
Name: {guardian['name']}
Email: {guardian['email']}
Password: {guardian['password']}
Phone: {guardian['phone']}
Access: Athlete management, claims, notifications
Login URL: http://localhost:3000/guardian/login
                """)

        # Summary
        total_accounts = (
            len(all_credentials['guardians']) + 
            len(all_credentials['organizations']) + 
            len(all_credentials['schools']) + 
            len(all_credentials['superadmins'])
        )

        self.stdout.write('\n' + '='*80)
        self.stdout.write(self.style.SUCCESS(f'📊 SUMMARY:'))
        self.stdout.write(f'Superadmins: {len(all_credentials["superadmins"])}')
        self.stdout.write(f'Organizations: {len(all_credentials["organizations"])}')
        self.stdout.write(f'Schools: {len(all_credentials["schools"])}')
        self.stdout.write(f'Guardians: {len(all_credentials["guardians"])}')
        self.stdout.write(f'Total Accounts: {total_accounts}')
        self.stdout.write('='*80)
        
        self.stdout.write(self.style.SUCCESS('\n✅ All test credentials are ready for use!'))
        self.stdout.write('💡 Use these credentials to test different user flows in the system.')
        self.stdout.write('🔐 All accounts are pre-verified and active.')