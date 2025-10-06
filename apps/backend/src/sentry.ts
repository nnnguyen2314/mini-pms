import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry for backend (Express)
// Safe to run with empty DSN (SDK becomes no-op)
const dsn = process.env.SENTRY_DSN || '';
const environment = process.env.SENTRY_ENV || process.env.NODE_ENV || 'development';

// Default low sample rate to avoid high volume by default; can be overridden via env
const tracesSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE
  ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
  : 0.05;

try {
  Sentry.init({
    dsn,
    environment,
    // Auto-detect release from env if provided by CI (e.g., SENTRY_RELEASE)
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate,
    integrations: [
      // Enable automatic Express instrumentation
      Sentry.expressIntegration(),
      // Lightweight profiling; harmless if not supported
      nodeProfilingIntegration(),
    ],
  });

  // Capture unhandled errors to help with crash diagnostics
  process.on('unhandledRejection', (reason: any) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled Rejection:', reason);
    Sentry.captureException(reason);
  });
  process.on('uncaughtException', (err: any) => {
    // eslint-disable-next-line no-console
    console.error('Uncaught Exception:', err);
    Sentry.captureException(err);
  });
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Sentry initialization failed:', e);
}

export {};