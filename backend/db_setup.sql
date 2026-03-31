-- ============================================================
--  MindMate PostgreSQL Database Setup
--  Run as PostgreSQL superuser: psql -U postgres -f db_setup.sql
-- ============================================================

-- Create role/user
CREATE ROLE mindmate_user WITH
  LOGIN
  PASSWORD 'change_this_password_in_production'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE;

-- Create database
CREATE DATABASE mindmate_db
  WITH
  OWNER = mindmate_user
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0
  CONNECTION LIMIT = 100;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mindmate_db TO mindmate_user;

-- Connect and set up schema permissions
\c mindmate_db

GRANT ALL ON SCHEMA public TO mindmate_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mindmate_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mindmate_user;

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- for fast text search

\echo '✅ MindMate database created successfully!'
\echo '   DB: mindmate_db | User: mindmate_user'
\echo '   Update the password before deploying to production!'