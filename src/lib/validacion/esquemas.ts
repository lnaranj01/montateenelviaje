import { z } from "zod";
import {
  DESTINO_MAX,
  DESTINO_MIN,
  ESTADOS,
  PRESUPUESTO_MINIMO,
} from "@/lib/config/viajes";

export const esquemaDeviceId = z.uuid();

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

export type DeviceId = z.infer<typeof esquemaDeviceId>;
export type DatosViajeValidos = z.infer<typeof esquemaViaje>;
export type FiltrosViaje = z.infer<typeof esquemaFiltros>;
