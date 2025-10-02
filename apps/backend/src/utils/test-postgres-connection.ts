import { pgPool, pgHealthcheck } from '../config/postgres.config';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const ok = await pgHealthcheck();
    if (!ok) throw new Error('Healthcheck failed');
    const { rows } = await pgPool.query('select now() as now');
    console.log('PostgreSQL connection OK. Server time:', rows[0].now);
    process.exit(0);
  } catch (e) {
    console.error('PostgreSQL connection failed:', e);
    process.exit(1);
  }
})();
