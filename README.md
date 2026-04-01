#  MindMate — Système de Soutien en Santé Mentale

> A full-stack mental health support system for students, built with **React + Django + PostgreSQL**.

---

##  Architecture

```
mindmate/
├── backend/                  # Django REST API
│   ├── mindmate_project/     # Django project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/         # Custom user model, JWT auth, roles
│   │   ├── cases/            # Support case management
│   │   ├── messages_app/     # In-app messaging
│   │   └── resources/        # Mental health resources
│   ├── requirements.txt
│   ├── manage.py
│   └── db_setup.sql          # PostgreSQL setup script
│
└── frontend/                 # React + Vite + Tailwind
    ├── src/
    │   ├── App.jsx            # Root router
    │   ├── main.jsx           # Entry point
    │   ├── contexts/
    │   │   ├── AuthContext.jsx   # JWT auth state
    │   │   └── ThemeContext.jsx  # Dark/light + i18n (FR/EN/RW)
    │   ├── services/
    │   │   └── api.js            # Axios + all API calls
    │   ├── components/
    │   │   ├── layout/AppShell.jsx
    │   │   └── common/index.jsx
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── RegisterPage.jsx
    │       ├── Dashboard.jsx
    │       ├── CasesPage.jsx
    │       ├── CaseDetail.jsx
    │       ├── MessagesPage.jsx
    │       ├── ResourcesPage.jsx
    │       ├── UsersPage.jsx
    │       ├── ReportsPage.jsx
    │       ├── ProfilePage.jsx
    │       └── NotFound.jsx
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

##  Quick Start

### 1. Database Setup (PostgreSQL)

```bash
# Install PostgreSQL if not installed
sudo apt install postgresql postgresql-contrib   # Ubuntu/Debian
brew install postgresql                          # macOS

# Run as postgres superuser
psql -U postgres -f backend/db_setup.sql
```

### 2. Backend Setup (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials and secret key

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json

# Start development server
python manage.py runserver
# API available at: http://localhost:8000/api/v1/
# Admin panel:      http://localhost:8000/admin/
# API Docs:         http://localhost:8000/api/docs/
```

### 3. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App available at: http://localhost:3000
```

---

##  API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | Login, get JWT tokens |
| POST | `/api/v1/auth/logout/` | Logout, blacklist token |
| POST | `/api/v1/auth/register/` | Register student/counselor |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token |
| GET/PATCH | `/api/v1/auth/me/` | Get/update own profile |
| POST | `/api/v1/auth/me/password/` | Change password |
| PATCH | `/api/v1/auth/me/preferences/` | Update theme/language |
| GET | `/api/v1/auth/dashboard/stats/` | Role-based stats |
| GET | `/api/v1/auth/counselors/` | List available counselors |
| GET/POST | `/api/v1/auth/users/` | Admin: list/create users |

### Support Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cases/` | List cases (role-filtered) |
| POST | `/api/v1/cases/` | Student: create case |
| GET | `/api/v1/cases/{id}/` | Case detail with notes |
| PATCH | `/api/v1/cases/{id}/update/` | Counselor: update status |
| POST | `/api/v1/cases/{id}/notes/` | Counselor: add note |
| GET | `/api/v1/cases/stats/` | Case statistics |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/messages/conversations/` | List conversations |
| POST | `/api/v1/messages/conversations/start/` | Start conversation |
| GET | `/api/v1/messages/conversations/{id}/messages/` | Get messages |
| POST | `/api/v1/messages/send/` | Send message |
| GET | `/api/v1/messages/unread/` | Unread count |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/resources/categories/` | List categories |
| GET | `/api/v1/resources/` | List resources |
| POST | `/api/v1/resources/` | Admin: create resource |
| GET/PUT/DELETE | `/api/v1/resources/{id}/` | Resource detail |

---

##  User Roles

| Role | Capabilities |
|------|-------------|
| **Student** | Submit cases, message counselors, access resources, view own cases |
| **Counselor** | View assigned cases, update status, add notes, message students |
| **Admin** | Full access — manage users, all cases, resources, system reports |

---

##  Database Tables

| Table | Purpose |
|-------|---------|
| `mm_users` | Custom user model (all roles) |
| `mm_student_profiles` | Student-specific data |
| `mm_counselor_profiles` | Counselor-specific data |
| `mm_support_cases` | Support request cases |
| `mm_case_notes` | Counselor notes on cases |
| `mm_case_activities` | Audit trail of case changes |
| `mm_conversations` | Message threads |
| `mm_messages` | Individual messages |
| `mm_resources` | Mental health educational content |
| `mm_resource_categories` | Resource categorisation |
| `mm_resource_views` | View tracking per user |
| `mm_password_reset_tokens` | Password reset flow |

---

##  Security Features

- **JWT Authentication** with access + refresh tokens
- **Token Blacklisting** on logout
- **Role-based access control** (RBAC) on all endpoints
- **CORS** configured for frontend origin only
- **Password validation** (Django's built-in validators)
- **Object-level permissions** (students only see own cases)
- **Private counselor notes** (not visible to students)
- **HTTPS-ready** with WhiteNoise for static files

---

##  Internationalisation

The frontend supports 3 languages (toggle in UI):
- 🇫🇷 **Français** (default)
- 🇬🇧 **English**
- 🇷🇼 **Kinyarwanda**

---

##  Dark / Light Mode

Persisted in `localStorage`, applied via Tailwind's `dark:` class strategy.  
Toggle available in sidebar, topbar, login page, and profile settings.

---

##  Production Deployment

```bash
# Backend
pip install gunicorn
gunicorn mindmate_project.wsgi:application --bind 0.0.0.0:8000

# Frontend
npm run build
# Serve the dist/ folder with Nginx or any static server

# Environment variables for production
DEBUG=False
SECRET_KEY=<strong-random-key>
ALLOWED_HOSTS=yourdomain.com
DB_HOST=your-postgres-host
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

##  Support & Contact

MindMate is designed for Rwandan university students. 🇷🇼  
For crisis support, always refer users to professional mental health services.

---

