"""
Enhanced management command to import athletes from CSV file with comprehensive field support.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.core.validators import validate_email
from apps.athletes.models import Athlete
from apps.schools.models import School
from apps.guardians.models import Guardian
from core.utils.validators import validate_phone_number
import csv
import os
from datetime import datetime
from decimal import Decimal, InvalidOperation


class Command(BaseCommand):
    help = 'Import athletes from CSV file with comprehensive field support'
    
    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to CSV file')
        parser.add_argument('--school-id', type=int, required=True, help='School ID for athletes')
        parser.add_argument('--dry-run', action='store_true', help='Perform dry run without saving')
        parser.add_argument('--update-existing', action='store_true', help='Update existing athletes instead of skipping')
        parser.add_argument('--batch-size', type=int, default=100, help='Number of records to process in each batch')
    
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        school_id = options['school_id']
        dry_run = options['dry_run']
        update_existing = options['update_existing']
        batch_size = options['batch_size']
        
        if not os.path.exists(csv_file):
            raise CommandError(f'CSV file "{csv_file}" does not exist.')
        
        try:
            school = School.objects.get(school_id=school_id, is_active=True)
        except School.DoesNotExist:
            raise CommandError(f'School with ID {school_id} does not exist or is not active.')
        
        self.stdout.write(f'Importing athletes for school: {school.name}')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE: No data will be saved.'))
        
        successful_imports = 0
        successful_updates = 0
        failed_imports = 0
        skipped_imports = 0
        errors = []
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                # Validate CSV headers
                required_headers = ['full_name', 'date_of_birth', 'gender', 'guardian_name', 'guardian_phone']
                missing_headers = [header for header in required_headers if header not in reader.fieldnames]
                if missing_headers:
                    raise CommandError(f'Missing required CSV headers: {", ".join(missing_headers)}')
                
                rows = list(reader)
                total_rows = len(rows)
                self.stdout.write(f'Found {total_rows} rows to process.')
                
                # Process in batches
                for batch_start in range(0, total_rows, batch_size):
                    batch_end = min(batch_start + batch_size, total_rows)
                    batch_rows = rows[batch_start:batch_end]
                    
                    self.stdout.write(f'Processing batch {batch_start + 1}-{batch_end} of {total_rows}...')
                    
                    with transaction.atomic():
                        for row_num, row in enumerate(batch_rows, start=batch_start + 2):
                            try:
                                athlete_data = self.parse_row(row, school, row_num)
                                
                                # Check for existing athlete
                                existing_athlete = Athlete.objects.filter(
                                    school=school,
                                    full_name__iexact=athlete_data['full_name'],
                                    date_of_birth=athlete_data['date_of_birth'],
                                    is_active=True
                                ).first()
                                
                                if existing_athlete:
                                    if update_existing and not dry_run:
                                        # Update existing athlete
                                        for field, value in athlete_data.items():
                                            if field not in ['school'] and value:
                                                setattr(existing_athlete, field, value)
                                        existing_athlete.save()
                                        existing_athlete.calculate_profile_completion()
                                        successful_updates += 1
                                    else:
                                        skipped_imports += 1
                                        if not update_existing:
                                            self.stdout.write(
                                                self.style.WARNING(f'Row {row_num}: Athlete already exists (skipped)')
                                            )
                                else:
                                    if not dry_run:
                                        # Create new athlete
                                        athlete = Athlete.objects.create(**athlete_data)
                                        athlete.calculate_profile_completion()
                                    successful_imports += 1
                                
                            except Exception as e:
                                failed_imports += 1
                                error_msg = f'Row {row_num}: {str(e)}'
                                errors.append(error_msg)
                                self.stdout.write(self.style.ERROR(error_msg))
                        
                        if dry_run:
                            # Rollback transaction for dry run
                            transaction.set_rollback(True)
        
        except Exception as e:
            raise CommandError(f'Error reading CSV file: {str(e)}')
        
        # Print summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nImport Summary:\n'
                f'New athletes created: {successful_imports}\n'
                f'Existing athletes updated: {successful_updates}\n'
                f'Skipped (duplicates): {skipped_imports}\n'
                f'Failed: {failed_imports}\n'
                f'Total processed: {successful_imports + successful_updates + skipped_imports + failed_imports}'
            )
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: No data was actually imported or updated.')
            )
        
        if errors:
            self.stdout.write(self.style.ERROR(f'\nFirst 10 errors (out of {len(errors)}):'))
            for error in errors[:10]:
                self.stdout.write(self.style.ERROR(f'  {error}'))
            if len(errors) > 10:
                self.stdout.write(self.style.ERROR(f'  ... and {len(errors) - 10} more errors'))
    
    def parse_row(self, row, school, row_num):
        """Parse and validate a CSV row into athlete data."""
        # Validate required fields
        required_fields = ['full_name', 'date_of_birth', 'gender', 'guardian_name', 'guardian_phone']
        for field in required_fields:
            if not row.get(field, '').strip():
                raise ValueError(f'Missing required field: {field}')
        
        # Parse and validate date of birth
        try:
            date_of_birth = datetime.strptime(row['date_of_birth'].strip(), '%Y-%m-%d').date()
        except ValueError:
            try:
                # Try alternative date format
                date_of_birth = datetime.strptime(row['date_of_birth'].strip(), '%d/%m/%Y').date()
            except ValueError:
                raise ValueError('Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY.')
        
        # Validate age
        from datetime import date
        today = date.today()
        age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
        if age < 5 or age > 25:
            raise ValueError(f'Invalid age: {age}. Must be between 5 and 25 years.')
        
        # Validate gender
        gender = row['gender'].strip().title()
        if gender not in ['Male', 'Female', 'Other']:
            raise ValueError(f'Invalid gender: {gender}. Must be Male, Female, or Other.')
        
        # Validate phone number
        guardian_phone = row['guardian_phone'].strip()
        try:
            validate_phone_number(guardian_phone)
        except Exception:
            raise ValueError(f'Invalid phone number format: {guardian_phone}')
        
        # Validate email if provided
        guardian_email = row.get('guardian_email', '').strip()
        if guardian_email:
            try:
                validate_email(guardian_email)
            except Exception:
                raise ValueError(f'Invalid email format: {guardian_email}')
        
        # Parse numeric fields
        height_cm = None
        if row.get('height_cm', '').strip():
            try:
                height_cm = int(row['height_cm'].strip())
                if height_cm < 50 or height_cm > 250:
                    raise ValueError(f'Invalid height: {height_cm}. Must be between 50-250 cm.')
            except ValueError:
                raise ValueError(f'Invalid height format: {row["height_cm"]}')
        
        weight_kg = None
        if row.get('weight_kg', '').strip():
            try:
                weight_kg = Decimal(row['weight_kg'].strip())
                if weight_kg < 10 or weight_kg > 200:
                    raise ValueError(f'Invalid weight: {weight_kg}. Must be between 10-200 kg.')
            except (ValueError, InvalidOperation):
                raise ValueError(f'Invalid weight format: {row["weight_kg"]}')
        
        # Validate blood group
        blood_group = row.get('blood_group', '').strip().upper()
        valid_blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        if blood_group and blood_group not in valid_blood_groups:
            raise ValueError(f'Invalid blood group: {blood_group}. Must be one of: {", ".join(valid_blood_groups)}')
        
        # Parse sports list
        registered_sports = []
        if row.get('registered_sports', '').strip():
            registered_sports = [sport.strip() for sport in row['registered_sports'].split(',') if sport.strip()]
        
        # Try to find existing guardian
        guardian = None
        if guardian_email:
            guardian = Guardian.objects.filter(email=guardian_email, is_active=True).first()
        
        # Build athlete data
        athlete_data = {
            'school': school,
            'guardian': guardian,
            'full_name': row['full_name'].strip(),
            'full_name_nepali': row.get('full_name_nepali', '').strip() or None,
            'date_of_birth': date_of_birth,
            'gender': gender,
            'nationality': row.get('nationality', 'Nepali').strip(),
            'citizenship_no': row.get('citizenship_no', '').strip() or None,
            'grade': row.get('grade', '').strip() or None,
            'section': row.get('section', '').strip() or None,
            'guardian_name': row['guardian_name'].strip(),
            'relationship_to_player': row.get('relationship_to_player', 'Father').strip(),
            'guardian_phone': guardian_phone,
            'guardian_email': guardian_email or None,
            'address': row.get('address', '').strip() or None,
            'province': row.get('province', '').strip() or None,
            'district': row.get('district', '').strip() or None,
            'municipality_or_rural_municipality': row.get('municipality', '').strip() or None,
            'ward_no': row.get('ward_no', '').strip() or None,
            'height_cm': height_cm,
            'weight_kg': weight_kg,
            'blood_group': blood_group or None,
            'registered_sports': registered_sports,
            'primary_sport': row.get('primary_sport', '').strip() or None,
            'father_name': row.get('father_name', '').strip() or None,
            'mother_name': row.get('mother_name', '').strip() or None,
            'medical_conditions': row.get('medical_conditions', '').strip() or None,
            'allergies': row.get('allergies', '').strip() or None,
            'emergency_contact': row.get('emergency_contact', '').strip() or None,
            'medical_notes': row.get('medical_notes', '').strip() or None,
            'registration_status': 'active',
        }
        
        return athlete_data