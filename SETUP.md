# Settle App - Setup Instructions

## Initial Setup

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# On Windows CMD:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create migrations (if needed)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Run development server
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend/bill-split

# Install dependencies
npm install

# Start development server
npm start
```

### 3. Access Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://127.0.0.1:8000/api/

## Environment Variables

Create `.env` file in the backend directory if needed:

```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
```

## Database Management

### Create Superuser (Admin)
```bash
python manage.py createsuperuser
```

### Access Admin Panel
- Go to: http://127.0.0.1:8000/admin
- Enter superuser credentials

### Reset Database
```bash
# Delete existing database
rm db.sqlite3

# Apply migrations
python manage.py migrate
```

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend/bill-split
npm test
```

## Deployment

For production deployment, see Django & React deployment guides:
- [Django Deployment](https://docs.djangoproject.com/en/6.0/howto/deployment/)
- [React Deployment](https://create-react-app.dev/deployment/)

## Troubleshooting

### Port Already in Use

**Backend (port 8000)**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

**Frontend (port 3000/3001)**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Dependencies Not Installing

```bash
# Clear pip cache
pip cache purge

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### CORS Errors

Check `backend/config/settings.py`:
- Ensure `corsheaders` is in `INSTALLED_APPS`
- Ensure `CorsMiddleware` is first in `MIDDLEWARE`
- Verify frontend URL is in `CORS_ALLOWED_ORIGINS`

## Getting Help

1. Check console for error messages
2. Review `backend/db.sqlite3` queries
3. Check browser developer tools (F12) for network errors
4. See README.md for detailed documentation
