import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

nextEnv.loadEnvConfig(process.cwd());

const nombresUrl = ['POSTGRES_URL_NON_POOLING', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL'];

export async function crearClientePostgres() {
  const [nombreUrl, valorUrl] = nombresUrl
    .map((nombre) => [nombre, process.env[nombre]])
    .find(([, valor]) => Boolean(valor)) ?? [];

  if (!nombreUrl || !valorUrl) {
    throw new Error(`Configura una URL de PostgreSQL (${nombresUrl.join(', ')}).`);
  }

  const url = new URL(valorUrl);
  for (const parametro of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    url.searchParams.delete(parametro);
  }

  const ssl = { rejectUnauthorized: true };
  const rutaCertificado = process.env.PGSSLROOTCERT;

  if (rutaCertificado) {
    ssl.ca = await readFile(path.resolve(rutaCertificado), 'utf8');
  }

  return {
    cliente: new Client({
      connectionString: url.toString(),
      ssl,
      connectionTimeoutMillis: 10_000,
    }),
    nombreUrl,
  };
}
