import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
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

dotenv.config();

const app = express();

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

// Static serving for uploaded files (local storage)
const uploadsDir = path.resolve(process.cwd(), 'apps', 'backend', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Healthcheck (no auth)
app.get('/health', (_req, res) => { res.json({ ok: true }); });

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

const port = process.env.PORT || 3100;
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
