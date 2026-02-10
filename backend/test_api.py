#!/usr/bin/env python
"""Test script to diagnose API errors"""
import os
import sys
import django
import time

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# Now test imports
print("✓ Django setup successful")

from django.contrib.auth.models import User
from expenses.models import Group, GroupMember, Expense, ExpenseShare, Settlement
from expenses.views import GroupViewSet
from expenses.serializers import GroupSerializer

# Test database
print(f"✓ Users in DB: {User.objects.count()}")
print(f"✓ Groups in DB: {Group.objects.count()}")

# Test demo user creation
user, created = User.objects.get_or_create(username="demo")
print(f"✓ Demo user: {user} (created={created})")

# Test group creation
group, created = Group.objects.get_or_create(
    name="Test Group",
    defaults={"description": "Test", "created_by": user}
)
print(f"✓ Test group: {group} (created={created})")

# Test serializer
serializer = GroupSerializer(instance=group)
print(f"✓ Serializer data: {serializer.data}")

print("\n✅ All tests passed - Backend should be working!")
