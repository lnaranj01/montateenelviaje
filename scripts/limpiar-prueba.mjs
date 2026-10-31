import { crearClientePostgres } from "./db-client.mjs";

const opciones = new Map([
  ["--prueba", "dev-test%"],
  ["--demo", "dev-demo%"],
]);

const opcion = process.argv[2];
const prefijo = opciones.get(opcion);

if (!prefijo || process.argv.length !== 3) {
  console.error("Uso: npm run db:limpiar -- --prueba|--demo");
  process.exitCode = 1;
} else {
  const { cliente, nombreUrl } = await crearClientePostgres();

  try {
    await cliente.connect();
    const { rows } = await cliente.query(
      `DELETE FROM public.viajes
       WHERE device_id LIKE $1
       RETURNING device_id`,
      [prefijo],
    );

    console.log(`Conexión: ${nombreUrl}`);
    console.log(`Viajes eliminados (${opcion}): ${rows.length}`);
  } catch (error) {
    console.error("No se pudieron limpiar los viajes de prueba.", error);
    process.exitCode = 1;
  } finally {
    await cliente.end();
  }
}
