import { z } from "zod";
import {
  DESTINO_MAX,
  DESTINO_MIN,
  ESTADOS,
  PRESUPUESTO_MINIMO,
} from "@/lib/config/viajes";
import {
  identificadoresServiciosViaje,
  validarServiciosPlanViaje,
} from "@/lib/reglas/planViaje";
import { finNoAnteriorAInicio } from "@/lib/reglas/fechas";

export const esquemaDeviceId = z.uuid();
export const esquemaIdViaje = z.uuid();

export const esquemaViaje = z.object({
  destino: z.string().trim().min(DESTINO_MIN).max(DESTINO_MAX),
  fechaInicio: z.iso.date(),
  fechaFin: z.iso.date(),
  presupuesto: z.coerce.number().int().min(PRESUPUESTO_MINIMO),
});

export const esquemaFiltros = z.object({
  estado: z.enum(ESTADOS).optional(),
  orden: z.enum(["inicio", "reciente"]).optional(),
});

export const esquemaViajeConDeviceId = esquemaViaje.extend({
  deviceId: esquemaDeviceId,
});

export const esquemaDeviceIdCuerpo = z.object({
  deviceId: esquemaDeviceId,
});

export const esquemaPlanGuardadoConDeviceId = z
  .object({
    deviceId: esquemaDeviceId,
    destino: z.string().trim().min(DESTINO_MIN).max(DESTINO_MAX),
    fechaInicio: z.iso.date(),
    fechaFin: z.iso.date(),
    presupuesto: z.coerce.number().int().min(1).max(1_000_000_000_000),
    viajeros: z.coerce.number().int().min(1).max(4),
    servicios: z.array(z.enum(identificadoresServiciosViaje)).min(1).max(5),
  })
  .superRefine((datos, contexto) => {
    if (!finNoAnteriorAInicio(datos.fechaInicio, datos.fechaFin)) {
      contexto.addIssue({
        code: "custom",
        message: "La fecha de salida no puede ser anterior a la de llegada.",
        path: ["fechaFin"],
      });
    }

    if (!validarServiciosPlanViaje(datos.servicios)) {
      contexto.addIssue({
        code: "custom",
        message: "Selecciona un solo servicio por categoría.",
        path: ["servicios"],
      });
    }
  });

export type DeviceId = z.infer<typeof esquemaDeviceId>;
export type IdViaje = z.infer<typeof esquemaIdViaje>;
export type DatosViajeValidos = z.infer<typeof esquemaViaje>;
export type DatosViajeConDeviceId = z.infer<typeof esquemaViajeConDeviceId>;
export type FiltrosViaje = z.infer<typeof esquemaFiltros>;
export type PlanGuardadoConDeviceId = z.infer<
  typeof esquemaPlanGuardadoConDeviceId
>;
