import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1114, (valor) => valor);
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));

const globalParaPool = globalThis as typeof globalThis & { poolViajes?: Pool };
const cadenaConexion =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL;

if (!cadenaConexion) {
  throw new Error(
    "Configura POSTGRES_URL_NON_POOLING, POSTGRES_URL o POSTGRES_PRISMA_URL.",
  );
}

const urlConexion = new URL(cadenaConexion);
for (const parametro of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
  urlConexion.searchParams.delete(parametro);
}

const certificadoRaiz = process.env.PGSSLROOTCERT;
const certificado = certificadoRaiz
  ? certificadoRaiz.includes("-----BEGIN CERTIFICATE-----")
    ? certificadoRaiz
    : readFileSync(path.resolve(certificadoRaiz), "utf8")
  : undefined;

const opcionesSsl = certificado
  ? { rejectUnauthorized: true, ca: certificado }
  : { rejectUnauthorized: true };

export const pool =
  globalParaPool.poolViajes ??
  new Pool({
    connectionString: urlConexion.toString(),
    ssl: opcionesSsl,
    max: 3,
    idleTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalParaPool.poolViajes = pool;
}

export async function consultar<T extends QueryResultRow>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const { rows } = await pool.query<T>(sql, valores);
  return rows;
}

export async function conTransaccion<T>(
  trabajo: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");
    const resultado = await trabajo(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    try {
      await cliente.query("ROLLBACK");
    } catch (errorRollback) {
      console.error(
        "No se pudo revertir la transacción de viajes.",
        errorRollback,
      );
      throw errorRollback;
    }

    throw error;
  } finally {
    cliente.release();
  }
}
