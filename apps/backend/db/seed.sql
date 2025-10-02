-- Seed data for PMS MVP (idempotent)
-- This script inserts demo data and sets the default password to PmsU3ser for seeded users.
-- Safe to run multiple times due to ON CONFLICT clauses.

-- Ensure we are targeting the application schema first
CREATE SCHEMA IF NOT EXISTS mini_pms;
SET search_path TO mini_pms, public;

-- Users
-- We store a development-friendly password format: plain$PmsU3ser
-- The application verifyPassword() supports this format alongside pbkdf2.
INSERT INTO mini_pms.users (id, name, email, password_hash, status, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Workspace Owner', 'worspace.owner@example.com', 'plain$PmsU3ser', 1, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Admin', 'nhatnguyen.nguyen23@gmail.com', 'plain$PmsU3ser', 1, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Project Owner', 'project.owner@example.com', 'plain$PmsU3ser', 1, now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'Member', 'member@example.com', 'plain$PmsU3ser', 1, now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'Guest', 'guest@example.com', 'plain$PmsU3ser', 1, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  status = EXCLUDED.status,
  updated_at = now();

-- Global user roles (system-wide)
-- Only system-wide roles go here. Currently, the only valid system role is ADMIN.
-- Grant ADMIN to the specified user email (id: 22222222-2222-2222-2222-222222222222)
INSERT INTO mini_pms.user_roles (user_id, role) VALUES
    ('22222222-2222-2222-2222-222222222222', 'ADMIN')
ON CONFLICT (user_id, role) DO NOTHING;

-- Workspace A (demo)
INSERT INTO mini_pms.workspaces (id, name, description, status, created_by, created_at, updated_at)
VALUES ('11111111-2222-3333-4444-555555555555', 'Demo Workspace', 'Getting started space', '1', '11111111-1111-1111-1111-111111111111', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = now();

-- Workspace B (demonstrates a user who is WORKSPACE_OWNER of a workspace but not an admin)
INSERT INTO mini_pms.workspaces (id, name, description, status, created_by, created_at, updated_at)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-111111111111', 'Secondary Workspace', 'A workspace owned by user 2222 (not admin)', '1', '22222222-2222-2222-2222-222222222222', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = now();

-- Workspace A members
INSERT INTO mini_pms.workspace_members (workspace_id, user_id, role) VALUES
  ('11111111-2222-3333-4444-555555555555', '11111111-1111-1111-1111-111111111111', 'WORKSPACE_OWNER'),
  ('11111111-2222-3333-4444-555555555555', '44444444-4444-4444-4444-444444444444', 'MEMBER'),
  ('11111111-2222-3333-4444-555555555555', '33333333-3333-3333-3333-333333333333', 'MEMBER')
ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- Workspace B members (2222 is WORKSPACE_OWNER here; not admin)
INSERT INTO mini_pms.workspace_members (workspace_id, user_id, role) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-111111111111', '33333333-3333-3333-3333-333333333333', 'WORKSPACE_OWNER'),
  ('aaaaaaaa-bbbb-cccc-dddd-111111111111', '11111111-1111-1111-1111-111111111111', 'MEMBER'),
  ('aaaaaaaa-bbbb-cccc-dddd-111111111111', '44444444-4444-4444-4444-444444444444', 'MEMBER')
ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- Project
INSERT INTO mini_pms.projects (id, workspace_id, name, description, status, created_by, created_at, updated_at)
VALUES ('22222222-3333-4444-5555-666666666666', '11111111-2222-3333-4444-555555555555', 'Demo Project', 'Sample project seeded by SQL', '1', '11111111-1111-1111-1111-111111111111', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = now();

-- Project members
INSERT INTO mini_pms.project_members (project_id, user_id, role) VALUES
--   ('22222222-3333-4444-5555-666666666666', '11111111-1111-1111-1111-111111111111', 'MEMBER'),
--   ('22222222-3333-4444-5555-666666666666', '22222222-2222-2222-2222-222222222222', 'MEMBER'),
  ('22222222-3333-4444-5555-666666666666', '33333333-3333-3333-3333-333333333333', 'PROJECT_OWNER')
ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- Board
INSERT INTO mini_pms.boards (id, project_id, name, created_at, updated_at)
VALUES ('33333333-4444-5555-6666-777777777777', '22222222-3333-4444-5555-666666666666', 'Main Board', now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

-- Columns
INSERT INTO mini_pms.board_columns (id, board_id, name, position, created_at, updated_at) VALUES
  ('44444444-5555-6666-7777-888888888888', '33333333-4444-5555-6666-777777777777', 'To Do', 0, now(), now()),
  ('55555555-6666-7777-8888-999999999999', '33333333-4444-5555-6666-777777777777', 'In Progress', 1, now(), now()),
  ('66666666-7777-8888-9999-000000000000', '33333333-4444-5555-6666-777777777777', 'Done', 2, now(), now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, updated_at = now();

-- Tasks
INSERT INTO mini_pms.tasks (id, project_id, board_id, column_id, title, description, status, priority, due_date, created_by, created_at, updated_at) VALUES
  ('77777777-8888-9999-aaaa-bbbbbbbbbbbb', '22222222-3333-4444-5555-666666666666', '33333333-4444-5555-6666-777777777777', '44444444-5555-6666-7777-888888888888', 'Set up repository', 'Initialize repo and base structure', 'open', 'high', null, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('88888888-9999-aaaa-bbbb-cccccccccccc', '22222222-3333-4444-5555-666666666666', '33333333-4444-5555-6666-777777777777', '55555555-6666-7777-8888-999999999999', 'Implement auth', 'JWT login and middleware', 'open', 'medium', null, '22222222-2222-2222-2222-222222222222', now(), now()),
  ('99999999-aaaa-bbbb-cccc-dddddddddddd', '22222222-3333-4444-5555-666666666666', '33333333-4444-5555-6666-777777777777', '66666666-7777-8888-9999-000000000000', 'Create seed data', 'Seed SQL and utilities', 'done', 'low', null, '33333333-3333-3333-3333-333333333333', now(), now())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  column_id = EXCLUDED.column_id,
  updated_at = now();

-- Task assignees
INSERT INTO mini_pms.task_assignees (task_id, user_id) VALUES
  ('77777777-8888-9999-aaaa-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
--   ('88888888-9999-aaaa-bbbb-cccccccccccc', '22222222-2222-2222-2222-222222222222'),
  ('99999999-aaaa-bbbb-cccc-dddddddddddd', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Labels
INSERT INTO mini_pms.labels (id, project_id, name, color) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '22222222-3333-4444-5555-666666666666', 'backend', '#8B5CF6'),
  ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', '22222222-3333-4444-5555-666666666666', 'frontend', '#10B981')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color;

-- Task labels
INSERT INTO mini_pms.task_labels (task_id, label_id) VALUES
  ('88888888-9999-aaaa-bbbb-cccccccccccc', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
  ('77777777-8888-9999-aaaa-bbbbbbbbbbbb', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff')
ON CONFLICT (task_id, label_id) DO NOTHING;

-- Comments
INSERT INTO mini_pms.comments (id, task_id, author_id, body, created_at, updated_at) VALUES
  ('eeeeeeee-ffff-0000-1111-222222222222', '88888888-9999-aaaa-bbbb-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Let make sure we add tests for auth.', now(), now())
ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, updated_at = now();

-- Activity logs
INSERT INTO mini_pms.activity_logs (id, workspace_id, project_id, task_id, actor_id, action, meta, created_at) VALUES
  ('dddddddd-eeee-ffff-0000-111111111111', '11111111-2222-3333-4444-555555555555', '22222222-3333-4444-5555-666666666666', '77777777-8888-9999-aaaa-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'task_created', '{"title":"Set up repository"}'::jsonb, now())
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, meta = EXCLUDED.meta;

-- Notifications
INSERT INTO mini_pms.notifications (id, user_id, type, title, body, entity_type, entity_id, meta, is_read, created_at)
VALUES ('cccccccc-dddd-eeee-ffff-000000000000', '11111111-1111-1111-1111-111111111111', 'welcome', 'Welcome', 'Your workspace is ready!', 'workspace', '11111111-2222-3333-4444-555555555555', '{}'::jsonb, false, now())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, is_read = EXCLUDED.is_read;

-- Role permissions
-- Ensure table exists locally for IDE/resolution when running this seed standalone
CREATE TABLE IF NOT EXISTS mini_pms.role_permissions (
  role text NOT NULL,
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);

INSERT INTO mini_pms.role_permissions (role, permission) VALUES
  -- Admin: all
  ('ADMIN','workspace:create'),
  ('ADMIN','workspace:update'),
  ('ADMIN','workspace:delete'),
  ('ADMIN','project:create'),
  ('ADMIN','project:update'),
  ('ADMIN','project:delete'),
  ('ADMIN','project:archive'),
  ('ADMIN','member:add:workspace'),
  ('ADMIN','member:remove:workspace'),
  ('ADMIN','member:add:project'),
  ('ADMIN','member:remove:project'),
  ('ADMIN','task:create'),
  ('ADMIN','task:update'),
  ('ADMIN','task:delete'),
  ('ADMIN','task:archive'),
  ('ADMIN','task:assign:self'),
  ('ADMIN','task:assign:other'),
  ('ADMIN','comment:create'),
  ('ADMIN','comment:delete:self'),
  ('ADMIN','comment:delete:other'),
  -- Workspace owner (manage own workspace, members, projects, and tasks)
  ('WORKSPACE_OWNER','workspace:update'),
  ('WORKSPACE_OWNER','member:add:workspace'),
  ('WORKSPACE_OWNER','member:remove:workspace'),
  ('WORKSPACE_OWNER','project:create'),
  ('WORKSPACE_OWNER','project:update'),
  ('WORKSPACE_OWNER','project:delete'),
  ('WORKSPACE_OWNER','project:archive'),
  ('WORKSPACE_OWNER','task:create'),
  ('WORKSPACE_OWNER','task:update'),
  ('WORKSPACE_OWNER','task:delete'),
  ('WORKSPACE_OWNER','task:archive'),
  ('WORKSPACE_OWNER','task:assign:self'),
  ('WORKSPACE_OWNER','task:assign:other'),
  ('WORKSPACE_OWNER','comment:create'),
  ('WORKSPACE_OWNER','comment:delete:self'),
  ('WORKSPACE_OWNER','comment:delete:other'),
  -- Project owner
  ('PROJECT_OWNER','member:add:project'),
  ('PROJECT_OWNER','member:remove:project'),
  ('PROJECT_OWNER','task:create'),
  ('PROJECT_OWNER','task:update'),
  ('PROJECT_OWNER','task:delete'),
  ('PROJECT_OWNER','task:archive'),
  ('PROJECT_OWNER','task:assign:self'),
  ('PROJECT_OWNER','task:assign:other'),
  ('PROJECT_OWNER','comment:create'),
  ('PROJECT_OWNER','comment:delete:self'),
  ('PROJECT_OWNER','comment:delete:other'),
  -- Member
  ('MEMBER','task:assign:self'),
  ('MEMBER','task:create'),
  ('MEMBER','task:update'),
  ('MEMBER','task:delete:own'),
  ('MEMBER','comment:create'),
  ('MEMBER','comment:delete:self')
ON CONFLICT DO NOTHING;
