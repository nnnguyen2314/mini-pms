# Deploying mini-pms to AWS with Docker and Nginx

This repository now contains a production-ready Docker + Nginx setup to run the app on a single host (e.g., an EC2 instance). Nginx terminates HTTP and reverse-proxies requests to the frontend (Next.js) and backend (Express) containers.

Contents added:
- Dockerfile.frontend — builds and runs the Next.js app.
- Dockerfile.backend — builds and runs the Node/Express API.
- nginx.conf — routes `/api/*` to the backend and everything else to the frontend.
- docker-compose.yml — orchestrates frontend, backend, nginx, and a Postgres service for convenience.
- .dockerignore — reduces Docker build context.
- Frontend API default updated to use a relative `/api` when running in a browser with no explicit env configured.

## Architecture
- Nginx listens on port 80 and proxies:
  - `/<anything>` and `/_next/*` → `frontend:3000`
  - `/api/*` → `backend:5000`
- Frontend uses the relative `/api` path by default in the browser so that all API calls go through Nginx on the same domain.

## Prerequisites
- Docker and Docker Compose installed on the host (EC2)
- For production DB, prefer AWS RDS PostgreSQL; otherwise the included `postgres` service is provided for quick start/testing.

## Quick start (single EC2 host)
1. Copy repo to your EC2 instance.
2. Set environment variables as needed (see below). For local testing, defaults in `docker-compose.yml` are sufficient.
3. Build and run:
   - `docker compose build`
   - `docker compose up -d`
4. Visit `http://<EC2_PUBLIC_IP>/`.

## Environment variables
Backend (service `backend`):
- `PORT` (default 5000)
- `DATABASE_URL` or `PG*` variables to connect to Postgres. In Compose defaults to the `postgres` service. For RDS, set e.g. `DATABASE_URL=postgres://USER:PASS@my-rds.xxxxxx.us-east-1.rds.amazonaws.com:5432/mini_pms`
- `JWT_SECRET` — set to a strong secret for production
- `CORS_ORIGIN` — optionally restrict to your domain (e.g., `https://your-domain.com`)

Frontend (service `frontend`):
- `NEXT_PUBLIC_API_BASE_URL` — Set this if you want to override the default. Usually not needed in this setup; default relative `/api` works when browser calls go through Nginx.

Nginx:
- `nginx.conf` is mounted read-only. Modify to add TLS later (see below).

## Using AWS RDS instead of local Postgres
- Remove or ignore the `postgres` service.
- Set backend `DATABASE_URL` (or `PG*`) to point to RDS. Remove `depends_on: - postgres` and update environment in `docker-compose.yml` accordingly.

## Logs and troubleshooting
- `docker compose logs -f nginx`
- `docker compose logs -f frontend`
- `docker compose logs -f backend`

## SSL/TLS (optional but recommended)
For HTTPS, you can:
- Terminate TLS on an AWS Application Load Balancer in front of the EC2 instance; or
- Terminate TLS directly in Nginx. For the latter, add your certificates and update `nginx.conf` to listen on 443 with `ssl_certificate` directives, then redirect 80→443.

## CI/CD (optional)
This setup is ready for a simple SSH-based deploy or can be adapted to ECS/ECR with minimal changes. For ECS, build images with these Dockerfiles and wire them behind an ALB with path-based routing `/api/*` → backend task and `/` → frontend task.

## Notes
- In development, Next.js still defaults to calling `http://localhost:5000/api` on the server side and `/api` in the browser if no envs are provided, which keeps local dev behavior intact.
- If you host frontend and backend on different domains, set `NEXT_PUBLIC_API_BASE_URL` to the API origin (e.g., `https://api.example.com`) and ensure CORS is configured on the backend.
