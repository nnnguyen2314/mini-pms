import './datadog';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
// Import morgan via require to avoid type dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const morgan = require('morgan');
// Import cookie-parser via require to avoid type dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
import cookieParser from 'cookie-parser';
import openapiSpec from './openapi.json';
import userRoutes from './routes/user.routes';
import meRoutes from './routes/me.routes';
import workspaceRoutes from './routes/workspace.routes';
import attachmentRoutes from './routes/attachment.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import taskRoutes from './routes/task.routes';
import projectRoutes from './routes/project.routes';
import commentRoutes from './routes/comment.routes';
import authRoutes from './routes/auth.routes';
import './sentry';
import * as Sentry from '@sentry/node';

dotenv.config();

const app = express();

// Sentry v8: Express integration is enabled via Sentry.init(...expressIntegration()).
// No explicit request middleware is required here.

// CORS: explicitly allow Authorization header and credentials for Swagger/browser use
const corsOptions: cors.CorsOptions = {
  origin: true, // reflect request origin
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Structured request logging to stdout/stderr for ELK/CloudWatch
const jsonFormat = (tokens: any, req: any, res: any) => {
  const log = {
    ts: tokens.date(req, res, 'iso'),
    level: 'info',
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res) || 0),
    response_time_ms: Number(tokens['response-time'](req, res) || 0),
    content_length: Number(tokens.res(req, res, 'content-length') || 0),
    referrer: tokens.referrer(req, res),
    user_agent: tokens['user-agent'](req, res),
    http_version: tokens['http-version'](req, res),
    remote_addr: tokens['remote-addr'](req, res),
  } as any;
  // Errors (4xx/5xx) will be logged with level=error via separate morgan instance
  return JSON.stringify(log);
};

// Success logs (status < 400) -> stdout
app.use(
  morgan(jsonFormat as any, {
    skip: (_req: any, res: any) => (res.statusCode >= 400),
    stream: process.stdout as unknown as NodeJS.WritableStream,
  } as any)
);
// Error logs (status >= 400) -> stderr with level=error
app.use(
  morgan((tokens: any, req: any, res: any) => {
    const base = JSON.parse(jsonFormat(tokens, req, res) || '{}');
    base.level = 'error';
    return JSON.stringify(base);
  }, {
    skip: (_req: any, res: any) => (res.statusCode < 400),
    stream: process.stderr as unknown as NodeJS.WritableStream,
  } as any)
);

// Anti-clickjacking headers (defense-in-depth; Nginx also sets these in production)
app.use((_, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self';");
  next();
});

// Static serving for uploaded files (local storage) + dev hotlink protection
const uploadsDir = path.resolve(process.cwd(), 'apps', 'backend', 'uploads');

// Dev/standalone defense-in-depth: prevent hotlinking of uploads when backend is accessed directly
// Allow requests with no Referer and same-origin Referer; block others
app.use('/uploads', (req, res, next) => {
  try {
    const referer = (req.headers.referer || req.headers.referrer) as string | undefined;
    if (!referer) return next(); // allow no-referrer
    const refUrl = new URL(referer);
    const host = (req.headers.host || '').toString();
    if (refUrl.host === host) return next(); // same-origin
  } catch (_) {
    // If parsing fails, treat as suspicious and block
  }
  res.status(403).send('Hotlinking forbidden');
});

app.use('/uploads', express.static(uploadsDir));

// Healthcheck (no auth)
app.get('/health', async (_req, res) => {
  try {
    const { redisStatus } = await import('./utils/redis');
    const status = redisStatus();
    res.json({ ok: true, redis: status });
  } catch {
    res.json({ ok: true });
  }
});

// Debug: echo request headers (non-production only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/headers', (req, res) => { res.json(req.headers as any); });
}

// Swagger UI
app.get('/docs.json', (_req, res) => { res.json(openapiSpec as any); });
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    explorer: true,
    swaggerOptions: {
      url: '/docs.json',
      persistAuthorization: true,
      // Ensure Authorization header is attached on Try it out requests when authorized in Swagger UI
      requestInterceptor: function (req: any) {
        try {
          const w: any = (globalThis as any).window || (function(){ return undefined; })();
          const ui = w && w.ui;
          let token: string | undefined;
          if (ui?.authSelectors?.authorized) {
            const auth = ui.authSelectors.authorized();
            // Try both JS and Immutable accessors used by Swagger UI
            const js = auth?.toJS ? auth.toJS() : auth;
            token = js?.bearerAuth?.value?.token
                 || auth?.getIn?.(['bearerAuth', 'value', 'token']);
          }
          if (token && !req.headers['Authorization'] && !req.headers['authorization']) {
            req.headers['Authorization'] = 'Bearer ' + token;
          }
        } catch (_) {
          // ignore
        }
        return req;
      }
    },
    customSiteTitle: 'PMS API Docs',
  } as any)
);

// Legacy users endpoints (kept for backward compatibility)
app.use('/users', userRoutes);
// Mount users under /api for modern clients
app.use('/api/users', userRoutes);

// New API routes
app.use('/api', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', attachmentRoutes);
app.use('/api', activityRoutes);
app.use('/api', notificationRoutes);
app.use('/api', taskRoutes);
app.use('/api', projectRoutes);
app.use('/api', commentRoutes);

// Test route to trigger an error for Sentry verification (non-production only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/error', (_req, _res) => {
    throw new Error('Test error for Sentry');
  });
}

// Sentry error handler must be before any other error middleware and after all routes (Sentry v8 API)
app.use(Sentry.expressErrorHandler());

// Global process error handlers -> stderr
process.on('unhandledRejection', (reason: any) => {
  const payload = { ts: new Date().toISOString(), level: 'error', type: 'unhandledRejection', message: reason?.message || String(reason), stack: reason?.stack };
  console.error(JSON.stringify(payload));
});
process.on('uncaughtException', (err: any) => {
  const payload = { ts: new Date().toISOString(), level: 'error', type: 'uncaughtException', message: err?.message || String(err), stack: err?.stack };
  console.error(JSON.stringify(payload));
});

const port = process.env.PORT || 3100;
const onListen = { ts: new Date().toISOString(), level: 'info', event: 'server_listen', msg: `Listening on port ${port}`, port };
app.listen(port, () => console.log(JSON.stringify(onListen)));

module.exports = app;
