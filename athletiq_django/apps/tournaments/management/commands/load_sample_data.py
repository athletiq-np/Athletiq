"""
Management command to load sample data for Athletiq system.
"""
import random
import uuid
import string
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from apps.tournaments.models import Tournament, TournamentSport, TournamentTeam, TournamentPlayer
from apps.schools.models import School, SchoolStaff
from apps.athletes.models import Athlete

User = get_user_model()

class Command(BaseCommand):
    help = 'Load sample tournament data for development and testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to load sample data...'))
        
        # Get or create a test user
        try:
            # First try to get an existing admin user
            user = User.objects.filter(is_staff=True).first()
            if not user:
                # If no admin exists, create one
                user = User.objects.create_user(
                    username='testadmin',
                    email='admin@example.com',
                    password='testpass123',
                    is_staff=True,
                    is_superuser=True,
                    full_name='Test Admin',
                    role='admin'
                )
                self.stdout.write(self.style.SUCCESS('Created test admin user'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Using existing admin user: {user.username}'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error setting up test user: {str(e)}'))
            # Try to get any user as fallback
            user = User.objects.first()
            if not user:
                self.stdout.write(self.style.ERROR('No users found in the database. Please create a user first.'))
                return
        
        # Sample data generation helpers
        def random_string(length=8):
            return ''.join(random.choices(string.ascii_letters, k=length))
            
        def random_phone():
            return f"+97798{random.randint(1000000, 9999999)}"
        
        # Sample sports data
        sports = [
            {'name': 'Football', 'category': 'Team', 'gender': 'male'},
            {'name': 'Basketball', 'category': 'Team', 'gender': 'female'},
            {'name': 'Volleyball', 'category': 'Team', 'gender': 'mixed'},
            {'name': 'Cricket', 'category': 'Team', 'gender': 'male'},
            {'name': 'Badminton', 'category': 'Individual', 'gender': 'mixed'},
            {'name': 'Athletics', 'category': 'Individual', 'gender': 'mixed'},
            {'name': 'Swimming', 'category': 'Individual', 'gender': 'mixed'},
            {'name': 'Table Tennis', 'category': 'Individual', 'gender': 'mixed'},
        ]
        
        # Sample districts and cities in Nepal
        districts = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Kaski', 'Nawalparasi', 'Rupandehi']
        
        # Create sample schools
        self.stdout.write(self.style.SUCCESS('Creating sample schools...'))
        schools = []
        for i in range(1, 6):
            school_name = f"{'ABCDE'[i-1]} Public School"
            district = random.choice(districts)
            
            # Create school admin user
            admin_username = f"school{i}admin"
            admin_email = f"admin@school{i}.edu.np"
            admin_password = 'school123'
            
            try:
                admin_user = User.objects.create_user(
                    username=admin_username,
                    email=admin_email,
                    password=admin_password,
                    full_name=f"Principal of {school_name}",
                    role='school_admin'
                )
                
                school = School.objects.create(
                    school_code=f"SCH{i:03d}",
                    name=school_name,
                    address=f"{random.choice(['New Baneshwor', 'Kupondole', 'Boudha', 'Jawalakhel', 'Pulchowk'])}",
                    country='Nepal',
                    province='Bagmati',
                    district=district,
                    city=district,
                    phone=random_phone(),
                    email=admin_email,
                    principal_name=f"Principal {random_string(6)}",
                    admin_user=admin_user,
                    onboarding_status='completed'
                )
                schools.append(school)
                self.stdout.write(self.style.SUCCESS(f'Created school: {school.name}'))
                
                # Add some staff
                staff_positions = ['Teacher', 'Sports Coordinator', 'Coach', 'Administrator']
                for pos in staff_positions:
                    SchoolStaff.objects.create(
                        school=school,
                        full_name=f"{pos.split()[0]} {random_string(6)}",
                        position=pos,
                        email=f"{pos.lower().replace(' ', '')}@school{i}.edu.np",
                        phone=random_phone(),
                        hire_date=datetime.now() - timedelta(days=random.randint(100, 1000)),
                        status='active'
                    )
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating school {school_name}: {str(e)}'))
        
        if not schools:
            self.stdout.write(self.style.ERROR('No schools were created. Cannot proceed with players and tournaments.'))
            return
            
        # Create sample players (athletes)
        self.stdout.write(self.style.SUCCESS('Creating sample players...'))
        first_names = ['Anil', 'Bikash', 'Chandra', 'Dipesh', 'Eshan', 'Firoz', 'Ganesh', 'Hari', 'Ishan', 'Jeevan']
        last_names = ['Acharya', 'Bhattarai', 'Chaudhary', 'Dhakal', 'Gurung', 'Karki', 'Lama', 'Pandey', 'Rai', 'Thapa']
        
        for school in schools:
            num_players = random.randint(20, 50)  # 20-50 players per school
            for i in range(1, num_players + 1):
                gender = random.choice(['Male', 'Female'])
                first_name = random.choice(first_names)
                last_name = random.choice(last_names)
                full_name = f"{first_name} {last_name}"
                
                try:
                    # Calculate birth date (ages 12-18)
                    birth_year = datetime.now().year - random.randint(12, 18)
                    birth_month = random.randint(1, 12)
                    birth_day = random.randint(1, 28)
                    birth_date = datetime(birth_year, birth_month, birth_day).date()
                    
                    Athlete.objects.create(
                        full_name=full_name,
                        gender=gender,
                        date_of_birth=birth_date,
                        school=school,
                        is_active=True
                    )
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error creating player {full_name}: {str(e)}'))
            
            self.stdout.write(self.style.SUCCESS(f'Created {num_players} players for {school.name}'))
        
        # Sample tournament data
        tournaments_data = [
            {
                'name': 'Inter-School Football Championship 2023',
                'description': 'Annual inter-school football championship for high schools',
                'sport': 'Football',
                'level': 'school',
                'start_date': datetime.now() + timedelta(days=30),
                'end_date': datetime.now() + timedelta(days=37),
                'location': 'Pokhara Stadium',
                'city': 'Pokhara',
                'country': 'Nepal',
                'status': 'upcoming',
                'format': 'group_stage',
                'max_teams': 16,
                'min_teams': 8,
                'entry_fee': 5000.00,
                'prize_pool': 100000.00,
            },
            {
                'name': 'National Basketball League',
                'description': 'National level basketball competition',
                'sport': 'Basketball',
                'level': 'national',
                'start_date': datetime.now() - timedelta(days=10),
                'end_date': datetime.now() + timedelta(days=30),
                'location': 'National Sports Council',
                'city': 'Kathmandu',
                'country': 'Nepal',
                'status': 'ongoing',
                'format': 'league',
                'max_teams': 12,
                'min_teams': 6,
                'entry_fee': 15000.00,
                'prize_pool': 500000.00,
            },
            {
                'name': 'Pokhara Volleyball Open',
                'description': 'Open volleyball tournament for all ages',
                'sport': 'Volleyball',
                'level': 'district',
                'start_date': datetime.now() + timedelta(days=60),
                'end_date': datetime.now() + timedelta(days=67),
                'location': 'Pokhara Sports Complex',
                'city': 'Pokhara',
                'country': 'Nepal',
                'status': 'upcoming',
                'format': 'knockout',
                'max_teams': 32,
                'min_teams': 16,
                'entry_fee': 2000.00,
                'prize_pool': 200000.00,
            },
        ]
        
        # Sample team names
        team_names = [
            'Lions', 'Tigers', 'Eagles', 'Panthers', 'Wolves', 'Sharks', 'Dragons',
            'Falcons', 'Raptors', 'Vikings', 'Spartans', 'Gladiators', 'Warriors',
            'Knights', 'Titans', 'Phoenix', 'Pirates', 'Ninjas', 'Samurai', 'Raiders'
        ]
        
        # Create tournaments
        for i, t_data in enumerate(tournaments_data, 1):
            # Generate tournament code
            t_data['tournament_code'] = f'TMN{i:03d}'
            
            # Randomly select a school as organizer for school-level tournaments
            organizer = random.choice(schools).admin_user if t_data['level'] == 'school' else user
            
            # Create tournament
            tournament = Tournament.objects.create(
                name=t_data['name'],
                description=t_data['description'],
                sport=t_data['sport'],
                level=t_data['level'],
                start_date=t_data['start_date'],
                end_date=t_data['end_date'],
                location=t_data['location'],
                city=t_data['city'],
                country=t_data['country'],
                status=t_data['status'],
                format=t_data['format'],
                max_teams=t_data['max_teams'],
                min_teams=t_data['min_teams'],
                entry_fee=t_data['entry_fee'],
                prize_pool=t_data['prize_pool'],
                organizer_id=organizer,
                created_by=organizer,
                is_published=True,
                registration_deadline=t_data['start_date'] - timedelta(days=7)
            )
            
            # Create tournament sport
            sport = next((s for s in sports if s['name'] == t_data['sport']), sports[0])
            tournament_sport = TournamentSport.objects.create(
                tournament=tournament,
                sport_name=sport['name'],
                category=sport['category'],
                gender=sport['gender'],
                max_teams=t_data['max_teams'],
                min_teams=t_data['min_teams'],
                players_per_team=11 if t_data['sport'] == 'Football' else (
                    5 if t_data['sport'] == 'Basketball' else 6
                ),
                format=t_data['format']
            )
            
            # Create sample teams and players
            num_teams = random.randint(t_data['min_teams'], t_data['max_teams'])
            for team_num in range(1, num_teams + 1):
                team_name = f"{random.choice(team_names)} {random.randint(1, 100)}"
                school_id = random.randint(1, 50) if t_data['level'] == 'school' else None
                
                team = TournamentTeam.objects.create(
                    tournament=tournament,
                    team_id=team_num,
                    team_name=team_name,
                    school_id=school_id,
                    registration_status='registered',
                    confirmed_date=datetime.now(),
                    seed_order=team_num,
                    contact_person=f"Coach {team_name.split()[0]}",
                    contact_phone=f"+97798{random.randint(1000000, 9999999)}",
                    contact_email=f"{team_name.lower().replace(' ', '')}@example.com"
                )
                
                # Create players for the team
                num_players = tournament_sport.players_per_team or 5
                for player_num in range(1, num_players + 1):
                    TournamentPlayer.objects.create(
                        tournament_team=team,
                        player_id=player_num,
                        player_name=f"Player {player_num} {team_name}",
                        jersey_number=player_num,
                        position='Player',
                        is_captain=(player_num == 1),
                        is_vice_captain=(player_num == 2),
                        is_eligible=True
                    )
            
            self.stdout.write(self.style.SUCCESS(f'Created tournament: {tournament.name}'))
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded sample data!'))
