-- Collaborative Project Management schema (workspaces, projects, boards, columns, tasks, comments, labels, memberships)
-- Safe to run multiple times (IF NOT EXISTS where possible)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Application schema: use a dedicated schema for app objects
CREATE SCHEMA IF NOT EXISTS mini_pms;
-- Ensure objects in this file are created in the pms schema
SET search_path TO mini_pms, public;

-- Users table (migrated from initial.sql)
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

-- Enums
DO $$
BEGIN
  -- Ensure enum type exists specifically in the 'pms' schema
  IF NOT EXISTS (
    SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE t.typname = 'workspace_role' AND n.nspname = 'mini_pms'
  ) THEN
    CREATE TYPE mini_pms.workspace_role AS ENUM ('WORKSPACE_OWNER','ADMIN','MEMBER','GUEST');
  END IF;

  -- Project role enum
  IF NOT EXISTS (
    SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE t.typname = 'project_role' AND n.nspname = 'mini_pms'
  ) THEN
    CREATE TYPE mini_pms.project_role AS ENUM ('PROJECT_OWNER','ADMIN','MEMBER','GUEST');
  END IF;

  -- System/global role enum
  IF NOT EXISTS (
    SELECT 1
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE t.typname = 'system_role' AND n.nspname = 'mini_pms'
  ) THEN
    CREATE TYPE mini_pms.system_role AS ENUM ('ADMIN');
  END IF;
END $$;

-- Table: workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Add workspace status column (text to store numeric enum as string)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS status text;

-- Table: workspace_members
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('WORKSPACE_OWNER', 'ADMIN', 'MEMBER', 'GUEST')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Add project status column (text to store numeric enum as string)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status text;
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);

-- Boards (Kanban)
CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_boards_project ON boards(project_id);

-- Columns (lists)
CREATE TABLE IF NOT EXISTS board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_columns_board ON board_columns(board_id);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES board_columns(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text, -- open/done/custom simple text for MVP
  priority text, -- low/medium/high for MVP
  due_date date,
  created_by text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);

-- Task assignees (many-to-many)
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);

-- Labels and task_labels
CREATE TABLE IF NOT EXISTS labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text
);
CREATE INDEX IF NOT EXISTS idx_labels_project ON labels(project_id);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);

-- Activity log (simple MVP)
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id text REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_task ON activity_logs(task_id);

-- Trigger function to auto-update updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $fn$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_updated_at') THEN
    CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'workspaces_set_updated_at') THEN
    CREATE TRIGGER workspaces_set_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'projects_set_updated_at') THEN
    CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'boards_set_updated_at') THEN
    CREATE TRIGGER boards_set_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'board_columns_set_updated_at') THEN
    CREATE TRIGGER board_columns_set_updated_at BEFORE UPDATE ON board_columns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tasks_set_updated_at') THEN
    CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'comments_set_updated_at') THEN
    CREATE TRIGGER comments_set_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;


-- Task attachments (files/images/videos)
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploader_id text NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  mime_type text,
  size_bytes bigint,
  storage_provider text, -- e.g., local, s3, gcs
  url text,              -- public URL if applicable
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);

-- Notifications (user-targeted)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,              -- e.g., task_assigned, comment_mention, team_invite
  title text,
  body text,
  entity_type text,                -- task | project | workspace | comment | team
  entity_id text,                  -- id as text to be flexible
  meta jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- Project members (membership and simple role)
CREATE TABLE IF NOT EXISTS project_members (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role mini_pms.project_role NOT NULL DEFAULT 'MEMBER',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- If project_members.role column exists as text in an older schema, migrate it to mini_pms.project_role safely
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'mini_pms' AND table_name = 'project_members' AND column_name = 'role';

  IF col_type = 'text' THEN
    -- Ensure default compatible values
    UPDATE mini_pms.project_members SET role = 'MEMBER' WHERE role IS NULL OR role NOT IN ('PROJECT_OWNER','ADMIN','MEMBER','GUEST');
    ALTER TABLE mini_pms.project_members ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE mini_pms.project_members ALTER COLUMN role TYPE mini_pms.project_role USING role::mini_pms.project_role;
    ALTER TABLE mini_pms.project_members ALTER COLUMN role SET DEFAULT 'MEMBER';
    ALTER TABLE mini_pms.project_members ALTER COLUMN role SET NOT NULL;
  END IF;
END $$;

-- Role-based permissions table (global by role)
CREATE TABLE IF NOT EXISTS mini_pms.role_permissions (
  role text NOT NULL,
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);

-- System/global user roles
CREATE TABLE IF NOT EXISTS mini_pms.user_roles (
  user_id text NOT NULL REFERENCES mini_pms.users(id) ON DELETE CASCADE,
  role mini_pms.system_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Seed permissions according to requirements (idempotent)
-- Global Admin: full access
INSERT INTO mini_pms.role_permissions (role, permission) VALUES
  ('GLOBAL:ADMIN','MANAGE_ALL')
ON CONFLICT DO NOTHING;

-- Workspace owner permissions (scoped)
INSERT INTO mini_pms.role_permissions (role, permission) VALUES
  ('WORKSPACE:WORKSPACE_OWNER','WORKSPACE_MANAGE'),
  ('WORKSPACE:WORKSPACE_OWNER','WORKSPACE_INVITE_MEMBERS'),
  ('WORKSPACE:WORKSPACE_OWNER','WORKSPACE_MANAGE_PROJECTS'),
  ('WORKSPACE:WORKSPACE_OWNER','WORKSPACE_MANAGE_TASKS'),
  ('WORKSPACE:WORKSPACE_OWNER','WORKSPACE_ASSIGN_TASKS')
ON CONFLICT DO NOTHING;

-- Project owner permissions (scoped)
INSERT INTO mini_pms.role_permissions (role, permission) VALUES
  ('PROJECT:PROJECT_OWNER','PROJECT_MANAGE'),
  ('PROJECT:PROJECT_OWNER','PROJECT_INVITE_MEMBERS'),
  ('PROJECT:PROJECT_OWNER','PROJECT_MANAGE_TASKS'),
  ('PROJECT:PROJECT_OWNER','PROJECT_ASSIGN_TASKS')
ON CONFLICT DO NOTHING;

-- Member permissions (scoped to project membership)
INSERT INTO mini_pms.role_permissions (role, permission) VALUES
  ('PROJECT:MEMBER','TASK_CREATE'),
  ('PROJECT:MEMBER','TASK_UPDATE_OWN'),
  ('PROJECT:MEMBER','TASK_DELETE_OWN'),
  ('PROJECT:MEMBER','PROJECT_ACCESS')
ON CONFLICT DO NOTHING;


-- Migration: rename legacy roles and constraints to new naming
-- 1) Project role enum: OWNER -> PROJECT_OWNER (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'mini_pms' AND t.typname = 'project_role' AND e.enumlabel = 'OWNER'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'mini_pms' AND t.typname = 'project_role' AND e.enumlabel = 'PROJECT_OWNER'
  ) THEN
    ALTER TYPE mini_pms.project_role RENAME VALUE 'OWNER' TO 'PROJECT_OWNER';
  END IF;
END $$;

-- 2) Workspace members: convert existing data and relax constraint
-- Convert legacy OWNER values to WORKSPACE_OWNER
UPDATE mini_pms.workspace_members SET role = 'WORKSPACE_OWNER' WHERE role = 'OWNER';
-- Drop old check constraint if present and recreate with new allowed values
ALTER TABLE mini_pms.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;
ALTER TABLE mini_pms.workspace_members
  ADD CONSTRAINT workspace_members_role_check CHECK (role IN ('WORKSPACE_OWNER','ADMIN','MEMBER','GUEST'));
