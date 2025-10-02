-- Initial schema: create application-owned users table inside the pms schema
-- Safe to run multiple times (IF NOT EXISTS)

-- Ensure the application schema exists and make it first on the search path
CREATE SCHEMA IF NOT EXISTS mini_pms;
SET search_path TO mini_pms, public;

-- Users table lives in pms schema
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text, -- PBKDF2 string: pbkdf2$iterations$salt$hexhash
  status smallint DEFAULT 0 NOT NULL CHECK (status IN (0,1,2,3)),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Trigger function to auto-update updated_at (kept in public schema; reused by other tables)
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_updated_at'
  ) THEN
    CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $do$;
