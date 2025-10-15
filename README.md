# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)

---

# GitHub CI/CD

This repository includes GitHub Actions workflows for CI and Docker build validation.

- CI (.github/workflows/ci.yml):
  - Triggers on pushes and pull requests to main/master.
  - Installs dependencies with Yarn, runs linting, type checks, builds via Turborepo, runs frontend unit tests (Jest), and builds the backend TypeScript.
- Docker Build (.github/workflows/docker-build.yml):
  - Validates both Dockerfiles by building images on PRs.
  - Optionally pushes images to GitHub Container Registry (GHCR) when a Personal Access Token is provided in repository secrets.

To enable container publishing (optional):
- Create a fine-scoped GitHub Personal Access Token with the `packages:write` permission and add it as `CR_PAT` secret in your repository settings.
- The workflow will push `latest` tags for backend and frontend when running on the `main` branch.

# Logging (stdout/stderr)

All runtime logs are emitted to stdout/stderr so they can be collected by Docker, ELK, CloudWatch, etc.

- Backend (Express):
  - Structured JSON request logs using morgan.
    - Successful requests (status < 400) are written to stdout.
    - Client/server errors (status >= 400) are written to stderr.
  - Unhandled errors (unhandledRejection/uncaughtException) are logged as JSON to stderr.
  - Server startup event is logged as a JSON line.
- Nginx:
  - access_log is set to /dev/stdout.
  - error_log is set to /dev/stderr.

Notes for aggregators:
- ELK: Use a JSON parser for the backend stream to extract fields (level, method, url, status, response_time_ms, etc.). The Nginx access log uses the "main" log_format and is not JSON by default.
- CloudWatch: When deployed on ECS/EKS or EC2 with the CloudWatch agent or FireLens, container stdout/stderr will be shipped automatically when configured with the awslogs/FireLens driver.

# Sentry (Error and Performance Monitoring)

This project is pre-wired to send backend (Express) errors and traces to Sentry.

## 1) Create a Sentry project and get the DSN
- Sign up / log in at https://sentry.io
- Create a new project (Platform: Node.js)
- Copy the DSN string (looks like https://examplePublicKey@o0.ingest.sentry.io/0)

## 2) Configure environment variables
Set the following for the backend service (docker-compose.yml has placeholders):

- SENTRY_DSN: your Sentry DSN
- SENTRY_ENV: environment name (e.g., development, staging, production)
- SENTRY_TRACES_SAMPLE_RATE: optional, default 0.05 (5%)
- SENTRY_RELEASE: optional, your release identifier (e.g., git sha)

Example (docker-compose.yml):

```
services:
  backend:
    environment:
      SENTRY_DSN: "<your DSN>"
      SENTRY_ENV: "production"
      SENTRY_TRACES_SAMPLE_RATE: "0.05"
```

If running locally without Docker, export them in your shell or .env file used by the backend.

## 3) Verify integration
- Start the stack (docker compose up --build) or run backend locally.
- Open http://localhost:5000/debug/error (only available when NODE_ENV !== 'production').
- This route deliberately throws to generate a Sentry event. Check your Sentry project for the new issue.

You can also review the code:
- apps/backend/src/sentry.ts initializes Sentry.
- apps/backend/src/index.ts wires Sentry request/tracing handlers and error handler.

## Notes
- If SENTRY_DSN is empty, the SDK stays effectively no-op; the app still runs.
- Sampling: Adjust SENTRY_TRACES_SAMPLE_RATE to control performance event volume.
- Frontend: If you want browser-side monitoring, add @sentry/nextjs later; current CSP only sets frame-ancestors, so it won’t block Sentry requests. Add connect-src for Sentry domains if you later introduce a restrictive CSP.



# Docker deployment

Run the full stack with Docker Compose (frontend, backend, nginx, and Postgres):

- Build and start (detached):
  - yarn deploy:docker
  - or: docker compose up -d --build

- View logs:
  - yarn docker:logs

- Stop and remove containers:
  - yarn docker:down

The stack exposes:
- Nginx at http://localhost (proxies /api to backend and serves frontend)
- Backend service on http://localhost:5000 (direct)
- Frontend service on http://localhost:3000 (direct)

Environment variables can be adjusted in docker-compose.yml. For production, configure a managed Postgres (e.g., AWS RDS) and set DATABASE_URL for the backend service.

# Redis Integration

This project supports Redis for shared refresh token storage (with an in-memory fallback for dev).

- Docker Compose now includes a `redis` service (port 6379). The backend is configured to connect via `REDIS_URL=redis://redis:6379` by default in docker-compose.
- If running locally without Docker, set one of:
  - `REDIS_URL=redis://127.0.0.1:6379`
  - or `REDIS_HOST=127.0.0.1` and `REDIS_PORT=6379`

Notes:
- When Redis is available, refresh token sessions are stored as JSON keys (refresh:{jti}) with TTLs, and family membership is tracked in a Redis Set (refreshfam:{familyId}) to support family-wide revocation.
- If Redis is not configured or unavailable, the server falls back to an in-memory Map (suitable for single-process dev only).


## Datadog Integration

This project includes optional Datadog integration for monitoring, performance, and logs.

- Frontend (Next.js): Browser RUM + Browser Logs via @datadog/browser-rum and @datadog/browser-logs.
- Backend (Express/Node): APM tracing with dd-trace, log correlation enabled via log injection.

Enable by setting environment variables:

Frontend (public env vars):
- NEXT_PUBLIC_DD_CLIENT_TOKEN=your_client_token
- NEXT_PUBLIC_DD_APPLICATION_ID=your_app_id
- NEXT_PUBLIC_DD_SITE=datadoghq.com (or datadoghq.eu, us3.datadoghq.com, etc.)
- NEXT_PUBLIC_DD_SERVICE=mini-pms-frontend
- NEXT_PUBLIC_DD_ENV=production (or staging, dev)
- Optional: NEXT_PUBLIC_DD_SAMPLE_RATE=100, NEXT_PUBLIC_DD_REPLAY_SAMPLE_RATE=20, NEXT_PUBLIC_DD_LOGS_SAMPLE_RATE=100

Backend:
- DD_ENABLED=true (or use DD_TRACE_ENABLED=true)
- DD_SERVICE=mini-pms-backend
- DD_ENV=production
- DD_VERSION=1.0.0
- DD_AGENT_HOST=host.docker.internal (or your agent host/IP)
- DD_TRACE_AGENT_PORT=8126 (default)
- Optional: DD_TRACE_DEBUG=true, DD_PROFILING_ENABLED=true

Notes:
- Frontend initializer is loaded in app/layout.tsx via app/DatadogInit.tsx and only runs if both client token and application id are set.
- Backend tracer is initialized at process start via src/datadog.ts imported first in src/index.ts and only activates if DD_ENABLED/ DD_TRACE_ENABLED is true.
- Backend logging uses morgan JSON to stdout/stderr; with dd-trace logInjection enabled, Datadog can correlate logs and traces if logs are shipped to Datadog.
