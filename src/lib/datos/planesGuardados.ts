import { consultar } from "@/lib/db/conexion";
import { duracionDias } from "@/lib/reglas/fechas";
import { calcularServiciosPlanViaje } from "@/lib/reglas/planViaje";
import type { DatosPlanGuardado, PlanGuardado } from "@/lib/datos/tipos";

interface FilaPlanGuardado {
  id: string;
  origen: string;
  destino: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto: number;
  viajeros: number;
  servicios: PlanGuardado["servicios"];
  total: number;
}

function mapearPlanGuardado(fila: FilaPlanGuardado): PlanGuardado {
  return {
    id: fila.id,
    origen: fila.origen,
    destino: fila.destino,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    presupuesto: fila.presupuesto,
    viajeros: fila.viajeros,
    servicios: fila.servicios,
    total: fila.total,
  };
}

export async function listarPlanesGuardados(
  deviceId: string,
): Promise<PlanGuardado[]> {
  const filas = await consultar<FilaPlanGuardado>(
    `SELECT id, origen, destino, fecha_inicio, fecha_fin, presupuesto, viajeros,
            servicios, total
     FROM public.planes_guardados
     WHERE device_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 100`,
    [deviceId],
  );

  return filas.map(mapearPlanGuardado);
}

export async function crearPlanGuardado(
  deviceId: string,
  datos: DatosPlanGuardado,
): Promise<PlanGuardado> {
  const dias = duracionDias(datos.fechaInicio, datos.fechaFin);
  const servicios = calcularServiciosPlanViaje(datos.servicios, {
    presupuesto: datos.presupuesto,
    dias,
    noches: Math.max(dias - 1, 0),
    viajeros: datos.viajeros,
  });
  const total = servicios.reduce((suma, servicio) => suma + servicio.precio, 0);

  const [fila] = await consultar<FilaPlanGuardado>(
    `INSERT INTO public.planes_guardados (
       device_id, origen, destino, fecha_inicio, fecha_fin, presupuesto, viajeros,
       servicios, total
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
     RETURNING id, origen, destino, fecha_inicio, fecha_fin, presupuesto, viajeros,
               servicios, total`,
    [
      deviceId,
      datos.origen.trim(),
      datos.destino.trim(),
      datos.fechaInicio,
      datos.fechaFin,
      datos.presupuesto,
      datos.viajeros,
      JSON.stringify(servicios),
      total,
    ],
  );

  if (!fila) {
    throw new Error("PostgreSQL no devolvió el plan guardado.");
  }

  return mapearPlanGuardado(fila);
}
