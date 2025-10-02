-- Danger: This script deletes ALL data in the mini_pms schema.
-- It truncates every table in the schema, restarting identities and cascading to dependents.
-- Use only in development or when you are absolutely sure.
--
-- Usage (psql):
--   psql "$DATABASE_URL" -f apps/backend/db/clear_all_data.sql
-- Or:
--   PGPASSWORD=... psql -h localhost -p 5432 -U postgres -d mini_pms_db -f apps/backend/db/clear_all_data.sql

-- Ensure we target the application schema
CREATE SCHEMA IF NOT EXISTS mini_pms;
SET search_path TO mini_pms, public;

DO $$
DECLARE
  tables text;
BEGIN
  -- Build a comma-separated list of all tables in the mini_pms schema
  SELECT string_agg(quote_ident(schemaname) || '.' || quote_ident(tablename), ', ')
    INTO tables
    FROM pg_tables
   WHERE schemaname = 'mini_pms';

  IF tables IS NULL THEN
    RAISE NOTICE 'No tables found in schema mini_pms. Nothing to truncate.';
  ELSE
    EXECUTE 'TRUNCATE TABLE ' || tables || ' RESTART IDENTITY CASCADE';
    RAISE NOTICE 'Truncated tables: %', tables;
  END IF;
END
$$ LANGUAGE plpgsql;
