-- DANGER: Dropping the users table will cascade to many dependent objects.
-- This script is intended for cleanup/reset purposes only.
-- If you run this, you will likely need to run `yarn db:init` to recreate schema and seed data.

-- Place objects in the search path with pms first
SET search_path TO mini_pms, public;

-- Drop the users table and all dependent objects
DROP TABLE IF EXISTS users CASCADE;
