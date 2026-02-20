# MySQL Setup Guide for Settle App

This guide helps you set up MySQL database for the Settle App.

## Option 1: Windows MySQL Installation

### Install MySQL Community Server

1. Download MySQL from: https://dev.mysql.com/downloads/mysql/
2. Run the installer and follow the setup wizard
3. Choose "MySQL Server 8.0.36" or latest version
4. During installation:
   - Choose "Config Type": Development Machine
   - Choose "MySQL as a Service"
   - Configure port as 3306
   - Set root password (or leave empty for no password)
   - Choose default character set as utf8mb4

5. After installation, start MySQL:
   ```bash
   net start MySQL80
   ```

6. Verify installation:
   ```bash
   mysql -u root -p
   # Enter password if set, or just press Enter if no password
   ```

## Option 2: Windows - Using MySQL with Docker

```bash
docker run -d --name mysql-settle --restart unless-stopped -p 3306:3306 -e MYSQL_ROOT_PASSWORD="" -e MYSQL_DATABASE="settle_app" mysql:8.0
```

## Option 3: Windows - Using MariaDB (MySQL Alternative)

1. Download MariaDB from: https://mariadb.org/download/
2. Run installer and follow setup wizard
3. Start MariaDB Service

## Create Database Manually

If MySQL is installed, run:

```bash
mysql -u root -p
# Enter password (if set)

CREATE DATABASE settle_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
EXIT;
```

## Configure .env File

Edit `.env` file in backend folder with your MySQL credentials:

```env
DATABASE_TYPE=mysql
MYSQL_DB=bill_split_db
MYSQL_USER=root
MYSQL_PASSWORD=Praju@90
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
```

## Run Migrations

```bash
cd backend
.\venv\Scripts\activate
python manage.py makemigrations
python manage.py migrate
```

## Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

## Start Server

```bash
python manage.py runserver 127.0.0.1:8000
```

## Switch Back to SQLite (if needed)

Edit `.env` and change:
```env
DATABASE_TYPE=sqlite
```

Then restart the server.

## Troubleshooting

### Error: Access denied for user 'root'@'localhost'

- **Cause**: Wrong password or no password set
- **Solution**: Update MYSQL_PASSWORD in .env file

### Error: Can't connect to MySQL server

- **Cause**: MySQL server not running
- **Solution**: 
  - Windows: `net start MySQL80`
  - Or restart MySQL service from Services

### Error: Unknown database 'settle_app'

- **Cause**: Database not created
- **Solution**: Run:
  ```bash
  mysql -u root -p
  CREATE DATABASE settle_app CHARACTER SET utf8mb4;
  ```

### Charset/Encoding Issues

All tables are created with UTF-8 MB4 encoding for full Unicode support.

## Verify Connection

Run:
```bash
python manage.py dbshell
```

This should open MySQL shell if connection is successful.

## Performance Tips

- Use indexes on frequently queried columns
- Enable query logging for troubleshooting
- Regular backups: `mysqldump -u root -p settle_app > backup.sql`

## Security Notes

- Change root password in production
- Don't use empty password in production
- Use environment variables for sensitive data
- Never commit .env file to version control
