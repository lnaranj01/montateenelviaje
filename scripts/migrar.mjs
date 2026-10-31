import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { crearClientePostgres } from './db-client.mjs';

const rutaMigraciones = path.resolve('supabase/migrations');
const archivoPerfiles = '20261003000000_create_profiles.sql';

async function perfilesYaMigrados(cliente) {
  const { rows } = await cliente.query(`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name IN ('id', 'display_name', 'avatar_url', 'created_at', 'updated_at')
      ) = 5 AS columnas_completas,
      COALESCE((
        SELECT relrowsecurity
        FROM pg_class
        WHERE oid = to_regclass('public.profiles')
      ), false) AS rls_activo,
      (
        SELECT COUNT(*)::int
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles'
      ) >= 2 AS politicas_completas,
      EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgrelid = to_regclass('auth.users')
          AND tgname = 'on_auth_user_created'
          AND NOT tgisinternal
      ) AS trigger_completo,
      EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
      ) AS funcion_completa
  `);
  const estado = rows[0];

  return Boolean(
    estado?.columnas_completas &&
      estado.rls_activo &&
      estado.politicas_completas &&
      estado.trigger_completo &&
      estado.funcion_completa,
  );
}

const { cliente, nombreUrl } = await crearClientePostgres();

try {
  await cliente.connect();
  await cliente.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const archivos = (await readdir(rutaMigraciones))
    .filter((archivo) => archivo.endsWith('.sql'))
    .sort();

  if (archivos.length === 0) {
    throw new Error(`No hay migraciones SQL en ${rutaMigraciones}.`);
  }

  for (const archivo of archivos) {
    await cliente.query('BEGIN');

    try {
      await cliente.query(
        "SELECT pg_advisory_xact_lock(hashtext('montateenelviaje:migrations'))",
      );

      const { rowCount } = await cliente.query(
        'SELECT 1 FROM public._migrations WHERE filename = $1',
        [archivo],
      );

      if (rowCount > 0) {
        await cliente.query('COMMIT');
        console.log(`omitida ${archivo} (registrada)`);
        continue;
      }

      if (archivo === archivoPerfiles && (await perfilesYaMigrados(cliente))) {
        await cliente.query(
          'INSERT INTO public._migrations (filename) VALUES ($1)',
          [archivo],
        );
        await cliente.query('COMMIT');
        console.log(`omitida ${archivo} (ya aplicada; registrada sin ejecutarla)`);
        continue;
      }

      const sql = await readFile(path.join(rutaMigraciones, archivo), 'utf8');
      await cliente.query(sql);
      await cliente.query(
        'INSERT INTO public._migrations (filename) VALUES ($1)',
        [archivo],
      );
      await cliente.query('COMMIT');
      console.log(`aplicada ${archivo}`);
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    }
  }

  console.log(`Migraciones verificadas usando ${nombreUrl}.`);
} catch (error) {
  const code = error instanceof Error && 'code' in error ? error.code : 'desconocido';
  console.error(`Error al migrar la base de datos (${code}): ${error.message}`);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
