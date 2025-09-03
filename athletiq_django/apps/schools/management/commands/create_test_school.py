from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from apps.authentication.models import User
from apps.schools.models import School, SchoolHouse, SchoolStaff, SchoolNotification


class Command(BaseCommand):
    help = 'Create a comprehensive test school with all necessary fields and related data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force create new school even if one exists for the user',
        )

    def handle(self, *args, **options):
        try:
            # Get admin user
            admin_user = User.objects.get(email='admin@admin.com')
            self.stdout.write(f"Found admin user: {admin_user.username} (ID: {admin_user.user_id})")
            
            # Check if school already exists
            existing_school = School.objects.filter(admin_user=admin_user).first()
            if existing_school and not options['force']:
                self.stdout.write(f"Admin user already has a school: {existing_school.name}")
                self.stdout.write("Use --force to create a new school anyway")
                return
            
            # Delete existing school if force is used
            if existing_school and options['force']:
                existing_school.delete()
                self.stdout.write(f"Deleted existing school: {existing_school.name}")

            # Create a comprehensive test school
            school = School.objects.create(
                # Required fields
                school_code="ATHLETIQ001",
                name="Athletiq International School",
                address="Kigali Innovation City, Gasabo District",
                country="Rwanda",
                province="Kigali",
                district="Gasabo",
                city="Kigali",
                ward="Gisozi",
                phone="+250788123456",
                email="admin@athletiqschool.rw",
                website="https://athletiqschool.rw",
                principal_name="Dr. Sarah Uwimana",
                admin_user=admin_user,
                onboarding_status="completed",
                is_active=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f"✅ Created comprehensive school: {school.name}")
            )
            
            # Create school houses
            houses_data = [
                {"name": "Phoenix", "color": "#EF4444", "points": 850},
                {"name": "Dragon", "color": "#3B82F6", "points": 920},
                {"name": "Griffin", "color": "#10B981", "points": 780},
                {"name": "Eagle", "color": "#F59E0B", "points": 690},
            ]
            
            for house_data in houses_data:
                house = SchoolHouse.objects.create(
                    school=school,
                    name=house_data["name"],
                    color=house_data["color"],
                    points=house_data["points"]
                )
                self.stdout.write(f"  📍 Created house: {house.name} ({house.points} points)")
            
            # Create school staff
            staff_data = [
                {
                    "full_name": "Dr. Sarah Uwimana",
                    "position": "Principal", 
                    "department": "Administration",
                    "email": "principal@athletiqschool.rw",
                    "phone": "+250788123456",
                    "hire_date": date(2020, 1, 15)
                },
                {
                    "full_name": "Mr. John Mutabazi",
                    "position": "Sports Coordinator",
                    "department": "Physical Education",
                    "email": "sports@athletiqschool.rw", 
                    "phone": "+250788234567",
                    "hire_date": date(2020, 3, 1)
                },
                {
                    "full_name": "Ms. Grace Kayitesi",
                    "position": "Coach",
                    "department": "Athletics",
                    "email": "athletics@athletiqschool.rw",
                    "phone": "+250788345678", 
                    "hire_date": date(2021, 1, 10)
                },
                {
                    "full_name": "Mr. David Nkurunziza",
                    "position": "Coach",
                    "department": "Football",
                    "email": "football@athletiqschool.rw",
                    "phone": "+250788456789",
                    "hire_date": date(2021, 8, 15)
                },
                {
                    "full_name": "Dr. Alice Mukandayisenga",
                    "position": "Vice Principal",
                    "department": "Academic Affairs",
                    "email": "vp@athletiqschool.rw",
                    "phone": "+250788567890",
                    "hire_date": date(2020, 2, 1)
                }
            ]
            
            for staff_info in staff_data:
                staff = SchoolStaff.objects.create(
                    school=school,
                    **staff_info,
                    status="active"
                )
                self.stdout.write(f"  👤 Created staff: {staff.full_name} - {staff.position}")
            
            # Create school notifications
            notifications_data = [
                {
                    "title": "Welcome to Athletiq School Portal",
                    "message": "Your school has been successfully registered in the Athletiq system. You can now manage your athletes, teams, and tournaments.",
                    "type": "success",
                    "priority": "high"
                },
                {
                    "title": "Complete Your School Profile", 
                    "message": "Please ensure all your school information is up to date for the best experience.",
                    "type": "info",
                    "priority": "medium"
                },
                {
                    "title": "Upcoming Tournament Registration",
                    "message": "Registration for the Rwanda Inter-School Championships opens next week. Don't miss out!",
                    "type": "warning",
                    "priority": "high"
                },
                {
                    "title": "System Maintenance Notice",
                    "message": "The system will undergo maintenance this Sunday from 2 AM to 4 AM EAT.",
                    "type": "info", 
                    "priority": "low"
                },
                {
                    "title": "New Features Available",
                    "message": "Check out the new athlete performance analytics in your dashboard!",
                    "type": "success",
                    "priority": "medium"
                }
            ]
            
            for notif_data in notifications_data:
                notification = SchoolNotification.objects.create(
                    school=school,
                    **notif_data,
                    read_status=False
                )
                self.stdout.write(f"  📢 Created notification: {notification.title}")
            
            # Summary
            self.stdout.write("\n" + "="*60)
            self.stdout.write(self.style.SUCCESS("🎉 SCHOOL CREATION COMPLETE"))
            self.stdout.write("="*60)
            self.stdout.write(f"School Name: {school.name}")
            self.stdout.write(f"School Code: {school.school_code}")
            self.stdout.write(f"Admin User: {admin_user.email}")
            self.stdout.write(f"Houses Created: {SchoolHouse.objects.filter(school=school).count()}")
            self.stdout.write(f"Staff Members: {SchoolStaff.objects.filter(school=school).count()}")
            self.stdout.write(f"Notifications: {SchoolNotification.objects.filter(school=school).count()}")
            self.stdout.write(f"School ID: {school.school_id}")
            self.stdout.write(f"Status: {school.onboarding_status.title()}")
            self.stdout.write("="*60)
                
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR("❌ Admin user not found! Please create an admin user first.")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error creating school: {e}")
            )
            import traceback
            traceback.print_exc()