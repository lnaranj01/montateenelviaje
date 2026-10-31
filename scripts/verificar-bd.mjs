import { crearClientePostgres } from './db-client.mjs';

const restriccionesEsperadas = [
  'viajes_destino_minimo',
  'viajes_presupuesto_ok',
  'viajes_fechas_ok',
];

const { cliente, nombreUrl } = await crearClientePostgres();
let fallas = 0;
let transaccionIniciada = false;

function resultado(nombre, correcto, detalle = '') {
  console.log(`${correcto ? 'OK' : 'FALLA'} ${nombre}${detalle ? `: ${detalle}` : ''}`);
  if (!correcto) {
    fallas += 1;
  }
}

async function insertarViaje(clienteActual, viaje) {
  await clienteActual.query(
    `INSERT INTO public.viajes (
      device_id, destino, fecha_inicio, fecha_fin, presupuesto, completado
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      viaje.deviceId,
      viaje.destino,
      viaje.fechaInicio,
      viaje.fechaFin,
      viaje.presupuesto,
      false,
    ],
  );
}

async function casoPermitido(clienteActual, nombre, viaje, savepoint) {
  await clienteActual.query(`SAVEPOINT ${savepoint}`);
  try {
    await insertarViaje(clienteActual, viaje);
    await clienteActual.query(`RELEASE SAVEPOINT ${savepoint}`);
    resultado(nombre, true);
  } catch (error) {
    await clienteActual.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await clienteActual.query(`RELEASE SAVEPOINT ${savepoint}`);
    const code = error instanceof Error && 'code' in error ? error.code : 'desconocido';
    resultado(nombre, false, `error PostgreSQL ${code}`);
  }
}

async function casoRechazado(
  clienteActual,
  nombre,
  viaje,
  restriccion,
  savepoint,
) {
  await clienteActual.query(`SAVEPOINT ${savepoint}`);
  let errorCapturado;

  try {
    await insertarViaje(clienteActual, viaje);
  } catch (error) {
    errorCapturado = error;
  }

  await clienteActual.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  await clienteActual.query(`RELEASE SAVEPOINT ${savepoint}`);

  const correcto =
    errorCapturado instanceof Error &&
    'code' in errorCapturado &&
    errorCapturado.code === '23514' &&
    'constraint' in errorCapturado &&
    errorCapturado.constraint === restriccion;
  resultado(
    nombre,
    correcto,
    correcto ? restriccion : 'no se rechazó con la restricción esperada',
  );
}

try {
  await cliente.connect();
  console.log(`Conexión: ${nombreUrl}`);

  const { rows: tablaRows } = await cliente.query(`
    SELECT to_regclass('public.viajes') IS NOT NULL AS existe
  `);
  const existeTabla = tablaRows[0]?.existe === true;
  console.log(`Tabla public.viajes: ${existeTabla ? 'existe' : 'NO existe'}`);
  resultado('existencia de tabla viajes', existeTabla);

  if (!existeTabla) {
    console.log('Filas: no disponible');
    for (const restriccion of restriccionesEsperadas) {
      resultado(`restricción ${restriccion}`, false, 'tabla inexistente');
    }
    resultado('RLS activo', false, 'tabla inexistente');
    for (const nombre of [
      'insert válido',
      'rechazo de presupuesto negativo',
      'rechazo de fechas invertidas',
      'rechazo de destino de un carácter',
      'viaje de un día',
    ]) {
      resultado(nombre, false, 'tabla inexistente');
    }
  } else {
    const { rows: conteoRows } = await cliente.query(
      'SELECT COUNT(*)::int AS total FROM public.viajes',
    );
    console.log(`Filas: ${conteoRows[0].total}`);

    const { rows: restriccionesRows } = await cliente.query(
      `SELECT conname
       FROM pg_constraint
       WHERE conrelid = 'public.viajes'::regclass
         AND conname = ANY($1::text[])`,
      [restriccionesEsperadas],
    );
    const restricciones = new Set(restriccionesRows.map((fila) => fila.conname));
    for (const nombre of restriccionesEsperadas) {
      resultado(
        `restricción ${nombre}`,
        restricciones.has(nombre),
        restricciones.has(nombre) ? 'presente' : 'ausente',
      );
    }

    const { rows: seguridadRows } = await cliente.query(`
      SELECT
        c.relrowsecurity AS rls_activo,
        (
          SELECT COUNT(*)::int
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'viajes'
        ) AS politicas
      FROM pg_class c
      WHERE c.oid = 'public.viajes'::regclass
    `);
    const seguridad = seguridadRows[0];
    console.log(`RLS activo: ${seguridad.rls_activo ? 'sí' : 'no'}`);
    resultado('RLS activo', seguridad.rls_activo);
    resultado('sin políticas públicas', seguridad.politicas === 0);

    const rolesPublicos = ['anon', 'authenticated'];
    const { rows: permisosRows } = await cliente.query(
      `SELECT
         has_table_privilege($1, 'public.viajes', 'SELECT') AS anon_select,
         has_table_privilege($2, 'public.viajes', 'SELECT') AS authenticated_select`,
      rolesPublicos,
    );
    resultado(
      'acceso de lectura revocado para anon y authenticated',
      !permisosRows[0].anon_select && !permisosRows[0].authenticated_select,
    );

    await cliente.query('BEGIN');
    transaccionIniciada = true;
    const viajeBase = {
      deviceId: 'dev-test',
      fechaInicio: '2026-12-10',
      fechaFin: '2026-12-15',
      presupuesto: 1_500_000,
    };

    await casoPermitido(
      cliente,
      'insert válido',
      { ...viajeBase, destino: 'Cartagena' },
      'caso_valido',
    );
    await casoRechazado(
      cliente,
      'rechazo de presupuesto negativo',
      { ...viajeBase, destino: 'Cartagena', presupuesto: -1 },
      'viajes_presupuesto_ok',
      'caso_presupuesto',
    );
    await casoRechazado(
      cliente,
      'rechazo de fechas invertidas',
      { ...viajeBase, destino: 'Cartagena', fechaFin: '2026-12-05' },
      'viajes_fechas_ok',
      'caso_fechas',
    );
    await casoRechazado(
      cliente,
      'rechazo de destino de un carácter',
      { ...viajeBase, destino: 'A' },
      'viajes_destino_minimo',
      'caso_destino',
    );
    await casoPermitido(
      cliente,
      'viaje de un día',
      {
        ...viajeBase,
        destino: 'Santa Marta',
        fechaFin: '2026-12-10',
      },
      'caso_un_dia',
    );
  }
} catch (error) {
  const code = error instanceof Error && 'code' in error ? error.code : 'desconocido';
  console.error(`Error verificando la base de datos (${code}): ${error.message}`);
  fallas += 1;
} finally {
  if (transaccionIniciada) {
    try {
      await cliente.query('ROLLBACK');
      console.log('Transacción de pruebas: ROLLBACK completado.');
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : 'desconocido';
      console.error(`No se pudo completar ROLLBACK (${code}): ${error.message}`);
      fallas += 1;
    }
  }

  await cliente.end();
}

console.log(`Total de fallas: ${fallas}`);
if (fallas > 0) {
  process.exitCode = 1;
}
