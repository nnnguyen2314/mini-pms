/*
Initialize Datadog APM (dd-trace) for the backend when enabled via env.
Must be imported before other instrumented modules in src/index.ts.
*/

/* eslint-disable @typescript-eslint/no-var-requires */
const enabled = process.env.DD_ENABLED === 'true' || process.env.DD_TRACE_ENABLED === 'true';

if (enabled) {
  const service = process.env.DD_SERVICE || process.env.npm_package_name || 'mini-pms-backend';
  const env = process.env.DD_ENV || process.env.NODE_ENV || 'development';
  const version = process.env.DD_VERSION || process.env.npm_package_version || undefined;

  // Initialize tracer
  require('dd-trace').init({
    service,
    env,
    version,
    logInjection: true,
    runtimeMetrics: true,
    profiling: true,
    // Respect DD_TRACE_DEBUG to print extra info
    debug: process.env.DD_TRACE_DEBUG === 'true',
    // Only enable if agent configuration is provided; it will default to DD_AGENT_HOST / DD_TRACE_AGENT_URL
  });

  // Optional: start CPU/Heap profiling if enabled
  try {
    if (process.env.DD_PROFILING_ENABLED === 'true') {
      // Profiling is already enabled via dd-trace when profiling:true in init; nothing else needed.
    }
  } catch {
    // ignore
  }
}

export {};