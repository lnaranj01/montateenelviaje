import { LIMITE_LISTADO } from "@/lib/config/viajes";
import { consultar, pool } from "@/lib/db/conexion";
import { duracionDias } from "@/lib/reglas/fechas";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { etiquetaEstado, validarViaje } from "@/lib/reglas/viaje";
import type {
  DatosViaje,
  FiltrosListadoViajes,
  ResumenViajes,
  Viaje,
} from "@/lib/datos/tipos";

interface FilaViaje {
  id: string;
  destino: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto: number;
  completado: boolean;
}

interface FilaConteo {
  total: number;
}

interface FilaResumen {
  total: number;
  planeados: number;
  completados: number;
  presupuesto_total: number;
}

interface ErrorPostgres {
  code: string;
  constraint?: string;
}

function esErrorPostgres(error: unknown): error is ErrorPostgres {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

function traducirErrorPostgres(error: unknown): never {
  if (esErrorPostgres(error) && error.code === "23514") {
    if (error.constraint === "viajes_fechas_ok") {
      throw new ErrorDeNegocio("FECHA_FIN_ANTERIOR");
    }

    throw new ErrorDeNegocio("DATOS_INVALIDOS");
  }

  throw error;
}

function mapearViaje(fila: FilaViaje): Viaje {
  return {
    id: fila.id,
    destino: fila.destino,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    presupuesto: fila.presupuesto,
    completado: fila.completado,
    estado: etiquetaEstado(fila.completado),
    duracionDias: duracionDias(fila.fecha_inicio, fila.fecha_fin),
  };
}

export async function listarViajes(
  deviceId: string,
  filtros: FiltrosListadoViajes = {},
): Promise<Viaje[]> {
  const condiciones = ["device_id = $1"];
  const valores: unknown[] = [deviceId];

  if (filtros.estado) {
    valores.push(filtros.estado === "Completado");
    condiciones.push(`completado = $${valores.length}`);
  }

  valores.push(LIMITE_LISTADO);
  const orden =
    filtros.orden === "inicio"
      ? "fecha_inicio ASC, id ASC"
      : "created_at DESC, id DESC";

  const filas = await consultar<FilaViaje>(
    `SELECT id, destino, fecha_inicio, fecha_fin, presupuesto, completado
     FROM public.viajes
     WHERE ${condiciones.join(" AND ")}
     ORDER BY ${orden}
     LIMIT $${valores.length}`,
    valores,
  );

  return filas.map(mapearViaje);
}

export async function contarViajes(deviceId: string): Promise<number> {
  const [fila] = await consultar<FilaConteo>(
    "SELECT COUNT(*) AS total FROM public.viajes WHERE device_id = $1",
    [deviceId],
  );

  if (!fila) {
    throw new Error("PostgreSQL no devolvió el conteo de viajes.");
  }

  return fila.total;
}

export async function obtenerViaje(
  deviceId: string,
  id: string,
): Promise<Viaje> {
  const [fila] = await consultar<FilaViaje>(
    `SELECT id, destino, fecha_inicio, fecha_fin, presupuesto, completado
     FROM public.viajes
     WHERE device_id = $1 AND id = $2`,
    [deviceId, id],
  );

  if (!fila) {
    throw new ErrorDeNegocio("VIAJE_NO_ENCONTRADO");
  }

  return mapearViaje(fila);
}

export async function crearViaje(
  deviceId: string,
  datos: DatosViaje,
): Promise<Viaje> {
  validarViaje(datos);

  try {
    const [fila] = await consultar<FilaViaje>(
      `INSERT INTO public.viajes (
        device_id, destino, fecha_inicio, fecha_fin, presupuesto, completado
      ) VALUES ($1, $2, $3, $4, $5, false)
      RETURNING id, destino, fecha_inicio, fecha_fin, presupuesto, completado`,
      [
        deviceId,
        datos.destino.trim(),
        datos.fechaInicio,
        datos.fechaFin,
        datos.presupuesto,
      ],
    );

    if (!fila) {
      throw new Error("PostgreSQL no devolvió el viaje creado.");
    }

    return mapearViaje(fila);
  } catch (error) {
    traducirErrorPostgres(error);
  }
}

export async function editarViaje(
  deviceId: string,
  id: string,
  datos: DatosViaje,
): Promise<Viaje> {
  validarViaje(datos);

  try {
    const [fila] = await consultar<FilaViaje>(
      `UPDATE public.viajes
       SET destino = $3,
           fecha_inicio = $4,
           fecha_fin = $5,
           presupuesto = $6
       WHERE device_id = $1 AND id = $2
       RETURNING id, destino, fecha_inicio, fecha_fin, presupuesto, completado`,
      [
        deviceId,
        id,
        datos.destino.trim(),
        datos.fechaInicio,
        datos.fechaFin,
        datos.presupuesto,
      ],
    );

    if (!fila) {
      throw new ErrorDeNegocio("VIAJE_NO_ENCONTRADO");
    }

    return mapearViaje(fila);
  } catch (error) {
    traducirErrorPostgres(error);
  }
}

export async function eliminarViaje(
  deviceId: string,
  id: string,
): Promise<void> {
  const [fila] = await consultar<{ id: string }>(
    `DELETE FROM public.viajes
     WHERE device_id = $1 AND id = $2
     RETURNING id`,
    [deviceId, id],
  );

  if (!fila) {
    throw new ErrorDeNegocio("VIAJE_NO_ENCONTRADO");
  }
}

export async function alternarCompletado(
  deviceId: string,
  id: string,
): Promise<Viaje> {
  const [fila] = await consultar<FilaViaje>(
    `UPDATE public.viajes
     SET completado = NOT completado
     WHERE device_id = $1 AND id = $2
     RETURNING id, destino, fecha_inicio, fecha_fin, presupuesto, completado`,
    [deviceId, id],
  );

  if (!fila) {
    throw new ErrorDeNegocio("VIAJE_NO_ENCONTRADO");
  }

  return mapearViaje(fila);
}

export async function obtenerResumen(deviceId: string): Promise<ResumenViajes> {
  const [fila] = await consultar<FilaResumen>(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE NOT completado) AS planeados,
       COUNT(*) FILTER (WHERE completado) AS completados,
       COALESCE(SUM(presupuesto), 0)::bigint AS presupuesto_total
     FROM public.viajes
     WHERE device_id = $1`,
    [deviceId],
  );

  if (!fila) {
    throw new Error("PostgreSQL no devolvió el resumen de viajes.");
  }

  return {
    total: fila.total,
    planeados: fila.planeados,
    completados: fila.completados,
    presupuestoTotal: fila.presupuesto_total,
  };
}

export async function cerrarPoolViajes(): Promise<void> {
  await pool.end();
}
