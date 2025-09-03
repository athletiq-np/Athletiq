#!/usr/bin/env python3
"""
Athletiq Django Application Entry Point
This file helps Railway detect this as a Python project
"""

import os
import sys

if __name__ == "__main__":
    # Add the Django project to the Python path
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'athletiq_django'))
    
    # Set the Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'athletiq.settings')
    
    # Import and run Django
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure it's installed and "
            "available on your PYTHONPATH environment variable."
        ) from exc
    
    # Run Django management command
    execute_from_command_line(sys.argv)