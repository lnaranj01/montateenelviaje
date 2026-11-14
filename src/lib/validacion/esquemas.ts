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
import type { TipoRutaVuelo } from "@/lib/reglas/vuelos";
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

const esquemaTipoRuta = z.enum(["nacional", "internacional"]);

export const esquemaAeropuerto = z.object({
  codigo: z.string().regex(/^[A-Z]{3}$/),
  nombre: z.string().trim().min(1).max(120),
  ciudad: z.string().trim().min(1).max(100),
  pais: z.string().trim().min(1).max(100),
  codigoPais: z.string().regex(/^[A-Z]{2}$/),
});

const esquemaSegmentoVuelo = z.object({
  aerolinea: z.string().trim().min(1).max(100),
  codigoAerolinea: z.string().regex(/^[A-Z0-9]{2,3}$/),
  numeroVuelo: z.string().trim().min(1).max(20),
  origenCodigo: z.string().regex(/^[A-Z]{3}$/),
  destinoCodigo: z.string().regex(/^[A-Z]{3}$/),
  salida: z.iso.datetime({ offset: true, local: true }),
  llegada: z.iso.datetime({ offset: true, local: true }),
  duracion: z.string().trim().min(1).max(30),
});

export const esquemaOpcionVuelo = z
  .object({
    id: z.string().trim().min(1).max(100),
    tipoRuta: esquemaTipoRuta,
    aerolinea: z.string().trim().min(1).max(100),
    segmentosIda: z.array(esquemaSegmentoVuelo).min(1).max(10),
    segmentosRegreso: z.array(esquemaSegmentoVuelo).max(10),
    escalasIda: z.number().int().min(0).max(9),
    escalasRegreso: z.number().int().min(0).max(9).nullable(),
    precio: z.number().int().min(1).max(1_000_000_000_000),
    moneda: z.literal("COP"),
    consultadoEn: z.iso.datetime(),
  })
  .superRefine((vuelo, contexto) => {
    if (vuelo.tipoRuta === "nacional") {
      if (vuelo.segmentosIda.length !== 1) {
        contexto.addIssue({
          code: "custom",
          message: "Los vuelos nacionales deben ser sin escalas.",
          path: ["segmentosIda"],
        });
      }

      if (
        vuelo.segmentosRegreso.length > 0 &&
        vuelo.segmentosRegreso.length !== 1
      ) {
        contexto.addIssue({
          code: "custom",
          message: "Los vuelos nacionales deben ser sin escalas.",
          path: ["segmentosRegreso"],
        });
      }
    }

    if (vuelo.escalasIda !== vuelo.segmentosIda.length - 1) {
      contexto.addIssue({
        code: "custom",
        message: "El número de escalas no coincide con los tramos.",
        path: ["escalasIda"],
      });
    }

    if (
      vuelo.escalasRegreso !== null &&
      vuelo.escalasRegreso !== vuelo.segmentosRegreso.length - 1
    ) {
      contexto.addIssue({
        code: "custom",
        message: "El número de escalas no coincide con los tramos.",
        path: ["escalasRegreso"],
      });
    }

    if (
      (vuelo.segmentosRegreso.length === 0) !==
      (vuelo.escalasRegreso === null)
    ) {
      contexto.addIssue({
        code: "custom",
        message: "La información del trayecto de regreso no es válida.",
        path: ["segmentosRegreso"],
      });
    }
  });

export const esquemaBusquedaAeropuertos = z.object({
  consulta: z.string().trim().min(2).max(80),
  tipoRuta: esquemaTipoRuta,
});

export const esquemaBusquedaVuelos = z
  .object({
    origen: z.string().regex(/^[A-Z]{3}$/),
    destino: z.string().regex(/^[A-Z]{3}$/),
    fechaIda: z.iso.date(),
    fechaRegreso: z.iso.date().optional(),
    viajeros: z.coerce.number().int().min(1).max(4),
    tipoRuta: esquemaTipoRuta,
  })
  .superRefine((datos, contexto) => {
    if (
      datos.fechaRegreso &&
      !finNoAnteriorAInicio(datos.fechaIda, datos.fechaRegreso)
    ) {
      contexto.addIssue({
        code: "custom",
        message: "La fecha de regreso no puede ser anterior a la fecha de ida.",
        path: ["fechaRegreso"],
      });
    }
  });

export type OpcionVueloValidada = z.infer<typeof esquemaOpcionVuelo>;
export type TipoRutaValidada = TipoRutaVuelo;

export const esquemaPlanGuardadoConDeviceId = z
  .object({
    deviceId: esquemaDeviceId,
    origen: z.string().trim().min(DESTINO_MIN).max(DESTINO_MAX),
    destino: z.string().trim().min(DESTINO_MIN).max(DESTINO_MAX),
    fechaInicio: z.iso.date(),
    fechaFin: z.iso.date(),
    presupuesto: z.coerce.number().int().min(1).max(1_000_000_000_000),
    viajeros: z.coerce.number().int().min(1).max(4),
    servicios: z.array(z.enum(identificadoresServiciosViaje)).max(5),
    vuelo: esquemaOpcionVuelo.optional(),
  })
  .superRefine((datos, contexto) => {
    if (!finNoAnteriorAInicio(datos.fechaInicio, datos.fechaFin)) {
      contexto.addIssue({
        code: "custom",
        message: "La fecha de salida no puede ser anterior a la de llegada.",
        path: ["fechaFin"],
      });
    }

    if (
      datos.servicios.length > 0 &&
      !validarServiciosPlanViaje(datos.servicios)
    ) {
      contexto.addIssue({
        code: "custom",
        message: "Selecciona un solo servicio por categoría.",
        path: ["servicios"],
      });
    }

    const tieneVueloCatalogo = datos.servicios.some(
      (servicio) => servicio === "vuelo-economico" || servicio === "vuelo-flexible",
    );

    if (datos.vuelo && tieneVueloCatalogo) {
      contexto.addIssue({
        code: "custom",
        message: "Selecciona un solo vuelo.",
        path: ["vuelo"],
      });
    }

    if (datos.vuelo && datos.servicios.length > 4) {
      contexto.addIssue({
        code: "custom",
        message: "Un plan admite un vuelo y hasta cuatro servicios adicionales.",
        path: ["servicios"],
      });
    }

    if (datos.servicios.length === 0 && !datos.vuelo) {
      contexto.addIssue({
        code: "custom",
        message: "Selecciona al menos un servicio o un vuelo.",
        path: ["servicios"],
      });
    }
  });

export const esquemaDatosInicialesPlanificador = z
  .object({
    origen: z.string().trim().min(DESTINO_MIN).max(DESTINO_MAX).optional(),
    destino: z.string().trim().min(DESTINO_MIN).max(DESTINO_MAX),
    fechaInicio: z.iso.date(),
    fechaFin: z.iso.date(),
    presupuesto: z.coerce.number().int().min(1).max(1_000_000_000_000),
    viajeros: z.coerce.number().int().min(1).max(4).optional(),
    servicios: z
      .array(z.enum(identificadoresServiciosViaje))
      .max(5)
      .optional(),
    vuelo: esquemaOpcionVuelo.optional(),
  })
  .superRefine((datos, contexto) => {
    if (!finNoAnteriorAInicio(datos.fechaInicio, datos.fechaFin)) {
      contexto.addIssue({
        code: "custom",
        message: "La fecha de salida no puede ser anterior a la de llegada.",
        path: ["fechaFin"],
      });
    }

    if (
      datos.servicios &&
      datos.servicios.length > 0 &&
      !validarServiciosPlanViaje(datos.servicios)
    ) {
      contexto.addIssue({
        code: "custom",
        message: "Selecciona un solo servicio por categoría.",
        path: ["servicios"],
      });
    }

    const tieneVueloCatalogo = datos.servicios?.some(
      (servicio) => servicio === "vuelo-economico" || servicio === "vuelo-flexible",
    );

    if (datos.vuelo && tieneVueloCatalogo) {
      contexto.addIssue({
        code: "custom",
        message: "Selecciona un solo vuelo.",
        path: ["vuelo"],
      });
    }

    if (datos.vuelo && (datos.servicios?.length ?? 0) > 4) {
      contexto.addIssue({
        code: "custom",
        message: "Un plan admite un vuelo y hasta cuatro servicios adicionales.",
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
export type DatosInicialesPlanificador = z.infer<
  typeof esquemaDatosInicialesPlanificador
>;
