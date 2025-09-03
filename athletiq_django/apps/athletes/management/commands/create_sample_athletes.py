from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random
from apps.schools.models import School, SchoolHouse
from apps.athletes.models import Athlete


class Command(BaseCommand):
    help = 'Create sample athletes for the school'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=25,
            help='Number of athletes to create (default: 25)',
        )

    def handle(self, *args, **options):
        try:
            # Get the school
            school = School.objects.filter(school_code='ATHLETIQ001').first()
            if not school:
                self.stdout.write(self.style.ERROR("❌ School ATHLETIQ001 not found!"))
                return
            
            # Get school houses for random assignment
            houses = list(SchoolHouse.objects.filter(school=school))
            if not houses:
                self.stdout.write(self.style.WARNING("⚠️ No houses found, creating athletes without house assignment"))
            
            count = options['count']
            
            # Sample athlete names (Rwandan names)
            male_names = [
                "Jean Baptiste Uwimana", "Patrick Nkurunziza", "Emmanuel Mugisha", 
                "David Habimana", "Samuel Kagame", "Joseph Bizimana", "Robert Niyonshuti",
                "Claude Mutabazi", "Eric Nsabimana", "Felix Rukundo", "Alex Byiringiro",
                "Daniel Ndayisaba", "Vincent Hakizimana", "Martin Hategeka", "Chris Munyakazi"
            ]
            
            female_names = [
                "Grace Uwimana", "Sarah Mukandayisenga", "Alice Kayitesi", "Marie Umubyeyi",
                "Jeanne Mukamana", "Claudine Uwamahoro", "Esperance Nyirahabimana", 
                "Solange Mukasonga", "Beatrice Nyiramana", "Immaculee Uwizeyimana",
                "Vestine Mukamuganga", "Chantal Nzeyimana", "Diane Uwera", "Agnes Mukarugwiza",
                "Francine Umutoni"
            ]
            
            created_count = 0
            
            for i in range(count):
                # Random gender
                gender = random.choice(['Male', 'Female'])
                
                # Select name based on gender
                if gender == 'Male':
                    full_name = random.choice(male_names)
                    male_names.remove(full_name)  # Avoid duplicates
                    if not male_names:  # Replenish if exhausted
                        male_names = [f"Student {i+1} Uwimana", f"Athlete {i+1} Mugisha", f"Player {i+1} Habimana"]
                else:
                    full_name = random.choice(female_names)
                    female_names.remove(full_name)  # Avoid duplicates
                    if not female_names:  # Replenish if exhausted
                        female_names = [f"Student {i+1} Mukamana", f"Athlete {i+1} Uwimana", f"Player {i+1} Kayitesi"]
                
                # Random age between 14-18 (typical secondary school age)
                age = random.randint(14, 18)
                birth_date = date.today() - timedelta(days=age*365 + random.randint(0, 365))
                
                # Create athlete
                athlete = Athlete.objects.create(
                    full_name=full_name,
                    gender=gender,
                    date_of_birth=birth_date,
                    school=school,
                    is_active=True
                )
                
                created_count += 1
                
                if created_count % 5 == 0:
                    self.stdout.write(f"  👨‍🎓 Created {created_count} athletes...")
            
            self.stdout.write("\n" + "="*50)
            self.stdout.write(self.style.SUCCESS("🏃‍♂️ ATHLETES CREATION COMPLETE"))
            self.stdout.write("="*50)
            self.stdout.write(f"School: {school.name}")
            self.stdout.write(f"Athletes Created: {created_count}")
            self.stdout.write(f"Total Athletes: {school.athletes.count()}")
            self.stdout.write(f"Male Athletes: {school.athletes.filter(gender='Male').count()}")
            self.stdout.write(f"Female Athletes: {school.athletes.filter(gender='Female').count()}")
            self.stdout.write("="*50)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error creating athletes: {e}")
            )
            import traceback
            traceback.print_exc()