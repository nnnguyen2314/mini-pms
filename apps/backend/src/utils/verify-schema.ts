import { pgPool } from '../config/postgres.config';
import dotenv from 'dotenv';

dotenv.config();

const expectedTables = [
  'users',
  'workspaces',
  'workspace_members',
  'projects',
  'boards',
  'board_columns',
  'tasks',
  'task_assignees',
  'labels',
  'task_labels',
  'comments',
  'activity_logs',
  'task_attachments',
  'notifications',
  'project_members',
];

(async () => {
  try {
    const client = await pgPool.connect();
    try {
      const { rows: schemas } = await client.query(
        `select nspname as schema, pg_catalog.pg_get_userbyid(nspowner) as owner
         from pg_namespace
         where nspname not like 'pg_%' and nspname <> 'information_schema'
         order by nspname;`
      );
      console.log('Schemas (excluding system schemas):');
      if (!schemas.length) {
        console.log('  - None found (only system schemas exist).');
      } else {
        for (const s of schemas) {
          console.log(`  - ${s.schema} (owner: ${s.owner})`);
        }
      }

      const { rows: tables } = await client.query(
        `select table_schema, table_name
           from information_schema.tables
          where table_schema not in ('pg_catalog','information_schema')
            and table_type = 'BASE TABLE'
          order by table_schema, table_name;`
      );

      console.log('\nTables:');
      if (!tables.length) {
        console.log('  - No user tables found.');
      } else {
        for (const t of tables) {
          console.log(`  - ${t.table_schema}.${t.table_name}`);
        }
      }

      // Quick check for expected tables in the application schema
      // Prefer the dedicated 'pms' schema if it exists; otherwise check 'public'
      const hasPms = schemas.some((s: any) => s.schema === 'pms');
      const targetSchema = hasPms ? 'pms' : 'public';
      const tableSet = new Set(tables.filter((t) => t.table_schema === targetSchema).map((t) => t.table_name));
      const missing = expectedTables.filter((t) => !tableSet.has(t));
      console.log(`\nVerification against expected tables in ${targetSchema} schema:`);
      if (missing.length === 0) {
        console.log('  ✓ All expected tables are present.');
      } else {
        console.log('  ! Missing tables:', missing.join(', '));
        console.log('  Hint: Run "yarn db:init" (or run db:initial, db:schema, then db:seed) and ensure you are connected to the correct database (PGDATABASE) with sufficient privileges.');
      }

      // Functions & triggers diagnostics
      const { rows: fnRows } = await client.query(
        `select n.nspname as schema, p.proname
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where p.proname = 'set_updated_at'
          order by n.nspname;`
      );
      console.log('\nFunction presence:');
      if (!fnRows.length) {
        console.log("  ! Function 'set_updated_at' not found in any schema.");
      } else {
        for (const r of fnRows) console.log(`  - ${r.schema}.set_updated_at`);
      }

      const { rows: sp } = await client.query('SHOW search_path');
      console.log(`\nsearch_path: ${sp[0].search_path}`);

      const { rows: trgRows } = await client.query(
        `select n.nspname as schema, c.relname as table, t.tgname as trigger
           from pg_trigger t
           join pg_class c on t.tgrelid = c.oid
           join pg_namespace n on c.relnamespace = n.oid
          where not t.tgisinternal and t.tgname like '%set_updated_at%'
          order by n.nspname, c.relname, t.tgname;`
      );
      console.log('\nUpdated-at triggers:');
      if (!trgRows.length) {
        console.log('  - None found');
      } else {
        for (const tr of trgRows) console.log(`  - ${tr.schema}.${tr.table}: ${tr.trigger}`);
      }

      // Show current database and user
      const { rows: ctx } = await client.query('select current_database() as db, current_user as user');
      console.log(`\nContext: database=${ctx[0].db}, user=${ctx[0].user}`);
    } finally {
      client.release();
    }
    process.exit(0);
  } catch (e) {
    console.error('Schema verification failed:', e);
    process.exit(1);
  }
})();
