#!/usr/bin/env python
"""
MySQL Database Setup Script for Settle App
Attempts to create database automatically or provides manual instructions
"""

import os
import sys
import mysql.connector
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_file = Path(__file__).parent / '.env'
load_dotenv(env_file)

# Configuration from .env
DB_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('MYSQL_PORT', 3306))
DB_USER = os.getenv('MYSQL_USER', 'root')
DB_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
DB_NAME = os.getenv('MYSQL_DB', 'settle_app')

print("=" * 60)
print("MySQL Database Setup for Settle App")
print("=" * 60)
print(f"\nConfiguration:")
print(f"  Host: {DB_HOST}")
print(f"  Port: {DB_PORT}")
print(f"  User: {DB_USER}")
print(f"  Database: {DB_NAME}")
print()

try:
    # Try to connect to MySQL server
    print("Connecting to MySQL server...")
    connection = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD if DB_PASSWORD else None,
        autocommit=True
    )
    
    cursor = connection.cursor()
    print("✓ Successfully connected to MySQL server!")
    
    # Create database if it doesn't exist
    print(f"\nCreating database '{DB_NAME}' with UTF-8 MB4 encoding...")
    cursor.execute(
        f"CREATE DATABASE IF NOT EXISTS {DB_NAME} "
        f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    print(f"✓ Database '{DB_NAME}' ready!")
    
    # Show existing databases
    print("\nExisting databases:")
    cursor.execute("SHOW DATABASES")
    for db in cursor.fetchall():
        print(f"  - {db[0]}")
    
    cursor.close()
    connection.close()
    
    print("\n" + "=" * 60)
    print("✓ DATABASE SETUP COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run migrations: python manage.py migrate")
    print("2. Create superuser: python manage.py createsuperuser")
    print("3. Start server: python manage.py runserver")
    print("\n")
    
except mysql.connector.Error as err:
    print(f"\n✗ ERROR: Could not connect to MySQL!")
    print(f"  Error: {err}")
    print("\n" + "=" * 60)
    print("MySQL Setup Instructions")
    print("=" * 60)
    print("\nTo fix this issue:")
    print("\n1. Install MySQL Community Server (if not installed):")
    print("   - Download: https://dev.mysql.com/downloads/mysql/")
    print("   - Run installer")
    print("   - Start MySQL service")
    print("\n2. Or use Docker (if you have Docker installed):")
    print('   docker run -d --name mysql-settle -p 3306:3306 -e MYSQL_ROOT_PASSWORD="" -e MYSQL_DATABASE="settle_app" mysql:8.0')
    print("\n3. Update .env file with correct credentials:")
    print("   - Edit backend/.env")
    print("   - Set MYSQL_PASSWORD if root has a password")
    print("   - Set MYSQL_HOST and MYSQL_PORT if different")
    print("\n4. Run this script again")
    print("\n5. For more help, see MYSQL_SETUP.md")
    print()
    sys.exit(1)

except Exception as err:
    print(f"\n✗ UNEXPECTED ERROR: {err}")
    print("\nFor help, see MYSQL_SETUP.md or check the .env file configuration")
    sys.exit(1)
