import Redis from 'ioredis';

let client: Redis | null = null;
let status: 'disabled' | 'connecting' | 'ready' | 'error' = 'disabled';
let lastError: string | undefined;

function getRedisUrl(): string | null {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  if (host || port) return `redis://${host || '127.0.0.1'}:${port || '6379'}`;
  return null;
}

export function getRedis(): Redis | null {
  if (client) return client;
  const url = getRedisUrl();
  if (!url) {
    status = 'disabled';
    return null;
  }
  status = 'connecting';
  client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(50 + times * 50, 2000),
  });
  client.on('ready', () => { status = 'ready'; });
  client.on('error', (err) => { status = 'error'; lastError = err?.message || String(err); });
  // Try to connect, but don't throw hard — allow fallback logic to proceed
  client.connect().catch((err) => { status = 'error'; lastError = err?.message || String(err); });
  return client;
}

export async function pingRedis(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const res = await r.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}

export function redisStatus(): { status: string; lastError?: string } {
  return { status, lastError };
}
