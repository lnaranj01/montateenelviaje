import nextEnv from '@next/env';
import { Client } from 'pg';
import { readFile } from 'node:fs/promises';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionOptions = [
  ['POSTGRES_URL_NON_POOLING', process.env.POSTGRES_URL_NON_POOLING],
  ['POSTGRES_URL', process.env.POSTGRES_URL],
  ['POSTGRES_PRISMA_URL', process.env.POSTGRES_PRISMA_URL],
].filter(([, connectionString]) => connectionString);
const allowUnverifiedTls = process.env.SUPABASE_DB_SSL_ALLOW_UNVERIFIED === '1';

if (connectionOptions.length === 0) {
  throw new Error('No PostgreSQL connection URL is configured.');
}

let client;
let connectedWith;
let connectionError;

for (const [name, connectionString] of connectionOptions) {
  let candidateConnectionString = connectionString;
  if (allowUnverifiedTls) {
    const parsedConnectionString = new URL(connectionString);
    parsedConnectionString.searchParams.set('uselibpqcompat', 'true');
    parsedConnectionString.searchParams.set('sslmode', 'require');
    candidateConnectionString = parsedConnectionString.toString();
  }

  const candidate = new Client({ connectionString: candidateConnectionString });

  try {
    await candidate.connect();
    client = candidate;
    connectedWith = name;
    break;
  } catch (error) {
    connectionError = error;
    await candidate.end().catch(() => {});
  }
}

if (!client) {
  const message = connectionError instanceof Error ? connectionError.message : String(connectionError);
  throw new Error(`Could not connect using configured PostgreSQL URLs: ${message}`);
}

try {
  const migration = await readFile(
    'supabase/migrations/20261003000000_create_profiles.sql',
    'utf8',
  );
  await client.query(migration);

  const { rows } = await client.query(`
    select
      table_info.relrowsecurity as rls_enabled,
      (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'profiles') as policy_count,
      exists (
        select 1
        from pg_trigger
        where tgrelid = 'auth.users'::regclass
          and tgname = 'on_auth_user_created'
          and not tgisinternal
      ) as auth_trigger_exists,
      (select count(*)::int from public.profiles) as profile_count
    from pg_class as table_info
    join pg_namespace as schema_info on schema_info.oid = table_info.relnamespace
    where schema_info.nspname = 'public' and table_info.relname = 'profiles'
  `);
  const verification = rows[0];

  if (!verification?.rls_enabled || verification.policy_count < 2 || !verification.auth_trigger_exists) {
    throw new Error('Profile table security verification failed.');
  }

  console.log(
    `Migration applied using ${connectedWith}; RLS: ${verification.rls_enabled}; policies: ${verification.policy_count}; auth trigger: ${verification.auth_trigger_exists}; profiles: ${verification.profile_count}`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const redactedMessage = [
    ...connectionOptions.map(([, value]) => value),
  ].reduce((result, secret) => (secret ? result.replaceAll(secret, '[redacted]') : result), message);

  console.error(`Migration failed: ${redactedMessage}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}