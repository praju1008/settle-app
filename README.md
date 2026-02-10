# Settle App 🧾

A full-stack bill-splitting and expense-sharing application built with **Django REST Framework** (Backend) and **React** (Frontend).

## Features ✨

- **Create Groups**: Form groups for shared expenses
- **Track Expenses**: Log who paid for what
- **Auto Calculate Splits**: Automatically divide expenses equally among group members
- **Settlement Tracking**: See who owes whom and track settlements
- **Real-time Updates**: Instant communication between frontend and backend via REST API
- **Easy UI**: Clean, intuitive React interface for managing bills

## Tech Stack 🛠️

### Backend
- **Django 6.0.2** - Python web framework
- **Django REST Framework 3.16.1** - REST API framework
- **django-cors-headers 4.9.0** - Cross-origin request handling
- **SQLite3** - Database
- **Python 3.13+**

### Frontend
- **React 19.2.4** - JavaScript UI library
- **Node.js & npm** - Package management
- **CSS3** - Styling

## Project Structure 📁

```
Settle App/
├── backend/                    # Django project
│   ├── config/                # Main configuration
│   │   ├── settings.py       # Django settings (CORS, DB, etc)
│   │   ├── urls.py           # URL routing for API
│   │   └── wsgi.py           # WSGI configuration
│   ├── expenses/              # Main app
│   │   ├── models.py         # 5 Models: Group, GroupMember, Expense, ExpenseShare, Settlement
│   │   ├── views.py          # 3 ViewSets: GroupViewSet, ExpenseViewSet, SettlementViewSet
│   │   ├── serializers.py    # Data serialization
│   │   ├── urls.py           # URL patterns
│   │   └── migrations/       # Database migrations
│   ├── venv/                 # Python virtual environment
│   ├── manage.py             # Django CLI
│   └── db.sqlite3            # SQLite database
│
├── frontend/                  # React project
│   └── bill-split/
│       ├── src/
│       │   ├── App.js        # Main React component
│       │   ├── api.js        # API client for backend communication
│       │   ├── components/   # Reusable components
│       │   │   └── ExpenseForm.js
│       │   ├── pages/        # Page components
│       │   │   ├── GroupsPage.js          # List groups
│       │   │   └── GroupDetailPage.js     # Group details
│       │   └── styles/       # CSS files
│       ├── public/
│       ├── package.json      # Dependencies
│       └── node_modules/     # Node packages
│
├── .gitignore               # Git ignore rules
├── README.md               # This file
└── check_status.py        # Status checking script
```

## Quick Start 🚀

### Prerequisites
- **Python 3.13+** with pip
- **Node.js 18+** with npm
- **Git**

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd "D:\PJ Projects\Python\Settle App\backend"
   ```

2. **Activate virtual environment**
   ```bash
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python dependencies** (if not already done)
   ```bash
   pip install django djangorestframework django-cors-headers
   ```

4. **Apply database migrations**
   ```bash
   python manage.py migrate
   ```

5. **Run Django development server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

   Backend will be available at: **http://127.0.0.1:8000**

### Frontend Setup

1. **In a new terminal, navigate to frontend directory**
   ```bash
   cd "D:\PJ Projects\Python\Settle App\frontend\bill-split"
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Start React development server**
   ```bash
   npm start
   ```

   Frontend will be available at: **http://localhost:3001**

### Access the Application

1. Open browser and go to: **http://localhost:3001**
2. The app will automatically connect to the backend API
3. Start creating groups and tracking expenses!

## API Endpoints 📡

All endpoints are accessible at `http://127.0.0.1:8000/api/`

### Groups
- **GET** `/api/groups/` - List all groups
- **POST** `/api/groups/` - Create new group
- **GET** `/api/groups/{id}/` - Get group details
- **PUT** `/api/groups/{id}/` - Update group
- **DELETE** `/api/groups/{id}/` - Delete group

### Expenses
- **GET** `/api/expenses/` - List all expenses
- **POST** `/api/expenses/` - Create new expense
- **GET** `/api/expenses/{id}/` - Get expense details
- **PUT** `/api/expenses/{id}/` - Update expense
- **DELETE** `/api/expenses/{id}/` - Delete expense

### Settlements
- **GET** `/api/settlements/` - List all settlements
- **POST** `/api/settlements/` - Create settlement
- **GET** `/api/settlements/{id}/` - Get settlement details

## Database Models 🗄️

### Group
```python
- id: UUID
- name: CharField(255)
- description: TextField
- created_by: ForeignKey(User)
- created_at: DateTimeField
- updated_at: DateTimeField
```

### GroupMember
```python
- id: UUID
- group: ForeignKey(Group)
- user: ForeignKey(User)
- joined_at: DateTimeField
```

### Expense
```python
- id: UUID
- group: ForeignKey(Group)
- description: CharField(255)
- amount: DecimalField
- paid_by: ForeignKey(User)
- created_at: DateTimeField
- updated_at: DateTimeField
```

### ExpenseShare
```python
- id: UUID
- expense: ForeignKey(Expense)
- user: ForeignKey(User)
- amount: DecimalField
```

### Settlement
```python
- id: UUID
- group: ForeignKey(Group)
- from_user: ForeignKey(User)
- to_user: ForeignKey(User)
- amount: DecimalField
- settled_at: DateTimeField (nullable)
- created_at: DateTimeField
```

## CORS Configuration ⚙️

The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- Network IP addresses on ports 3000 & 3001

See `backend/config/settings.py` for details.

## Development Workflow 🔄

1. **Backend changes**: Restart Django server (Ctrl+C then `python manage.py runserver`)
2. **Frontend changes**: React hot-reloads automatically
3. **New database schema**: Run `python manage.py makemigrations` then `python manage.py migrate`

## Troubleshooting 🔧

### Backend won't start
```bash
# Check Django configuration
python manage.py check

# Verify database
python manage.py migrate
```

### CORS errors in console
- Ensure backend is running on `127.0.0.1:8000`
- Ensure frontend is running on port 3000 or 3001
- Check `backend/config/settings.py` CORS_ALLOWED_ORIGINS

### Database errors
```bash
# Reset database
rm db.sqlite3
python manage.py migrate
```

## Contributing 📝

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add your feature"`
3. Push: `git push origin feature/your-feature`
4. Create Pull Request

## License 📄

This project is open source and available under the MIT License.

## Author 👤

Created as a full-stack expense management application.

---

**Ready to share bills fairly?** 💰 Start using Settle App today!
