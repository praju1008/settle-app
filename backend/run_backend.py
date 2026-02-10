"""Backend diagnostic and startup script"""
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

try:
    django.setup()
    print("[OK] Django setup successful")
except Exception as e:
    print(f"[ERROR] Django setup failed: {e}")
    sys.exit(1)

from django.contrib.auth.models import User
from expenses.models import Group

# Check database
try:
    user_count = User.objects.count()
    group_count = Group.objects.count()
    print(f"[OK] Database access OK - Users: {user_count}, Groups: {group_count}")
except Exception as e:
    print(f"[ERROR] Database error: {e}")
    sys.exit(1)

# Ensure demo user exists
try:
    user, created = User.objects.get_or_create(username="demo", defaults={"email": "demo@test.com"})
    print(f"[OK] Demo user OK (created={created})")
except Exception as e:
    print(f"[ERROR] Demo user creation failed: {e}")
    sys.exit(1)

print("\n[READY] Backend diagnostics passed!")
print("\nStarting development server...")
print("Server will run at: http://127.0.0.1:8000")
print("API endpoints:")
print("  - http://127.0.0.1:8000/api/groups/")
print("  - http://127.0.0.1:8000/api/expenses/")
print("  - http://127.0.0.1:8000/api/settlements/")
print("\nPress Ctrl+C to stop the server.\n")

# Start server
os.system("python manage.py runserver 0.0.0.0:8000")
