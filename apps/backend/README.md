### `npm install`

Install dependencies

### `npm run start`

Runs the app in the development mode.\
Open [http://localhost:3100](http://localhost:3100) to view it in the browser.

### `npm run start:prod`

Runs the app in the production mode.\
Open [http://localhost:3100](http://localhost:3100) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### Database

This application is using Firebase to store data.
You can see the sample firebase configs in `src/utils/firebase/configs`

## Membership Management and Authorization

The backend enforces simple role-based rules for managing workspace and project memberships.

Rules:
- Only workspace OWNER or ADMIN can add/remove members in a workspace.
- For a project, workspace OWNER/ADMIN or the project owner (the user who created the project) can add/remove project members.
- Regular members cannot self-join or leave workspaces/projects; there are no self-serve join/leave endpoints.

Database schema additions (applied via the schema tool):
- Table project_members (project_id, user_id, role text default 'MEMBER', joined_at, PK(project_id,user_id)).

Apply schema:
- From repo root: yarn build
- Then: (cd apps/backend && node ./dist/utils/run-sql.js apps/backend/db/mini_pms.sql)

Seed default users and roles:
- A seed file is provided to create default user accounts and a Default Workspace with role assignments.
- Admin account email is set to: nhatnguyen.nguyen23@gmail.com

Run the seed:
- From repo root: yarn build
- Then: (cd apps/backend && node ./dist/utils/run-sql.js apps/backend/db/seed.sql)

Seeded records:
- Users (status=Active):
  - id=owner,  name=Owner User,  email=owner@example.com
  - id=admin,  name=Admin User,  email=nhatnguyen.nguyen23@gmail.com
  - id=member, name=Member User, email=member@example.com
  - id=guest,  name=Guest User,  email=guest@example.com
- Workspace:
  - id=00000000-0000-0000-0000-000000000001, name=Default Workspace
- Workspace members:
  - owner => OWNER
  - admin => ADMIN
  - member => MEMBER
  - guest => GUEST

Endpoints (all require auth and live under /api):
- Workspace members:
  - POST /api/workspaces/:id/members
    - Body: { userId, role?: 'ADMIN'|'MEMBER'|'GUEST' }
    - Only workspace OWNER/ADMIN can call.
  - DELETE /api/workspaces/:id/members/:userId
    - Only workspace OWNER/ADMIN can call. Cannot remove OWNER.
- Project members:
  - POST /api/projects/:id/members
    - Body: { userId, role?: 'MEMBER'|'GUEST' }
    - Allowed for workspace OWNER/ADMIN of the parent workspace or the project owner.
  - DELETE /api/projects/:id/members/:userId
    - Same authorization as above.
