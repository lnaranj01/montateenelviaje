export type CodigoError =
  | "DATOS_INVALIDOS"
  | "NO_AUTORIZADO"
  | "PLAN_NO_ENCONTRADO"
  | "VIAJE_NO_ENCONTRADO"
  | "FECHA_FIN_ANTERIOR"
  | "ERROR_INTERNO";

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: "Revise los datos ingresados.",
  NO_AUTORIZADO: "Debe iniciar sesión.",
  PLAN_NO_ENCONTRADO: "El plan guardado no existe.",
  VIAJE_NO_ENCONTRADO: "El viaje no existe.",
  FECHA_FIN_ANTERIOR: "La fecha de fin no puede ser anterior a la de inicio.",
  ERROR_INTERNO: "Ocurrió un error inesperado. Intente de nuevo.",
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  PLAN_NO_ENCONTRADO: 404,
  VIAJE_NO_ENCONTRADO: 404,
  FECHA_FIN_ANTERIOR: 422,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  readonly codigo: CodigoError;
  readonly detalles?: unknown;

  constructor(codigo: CodigoError, mensaje?: string, detalles?: unknown) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = "ErrorDeNegocio";
    this.codigo = codigo;
    if (detalles !== undefined) {
      this.detalles = detalles;
    }
  }
}
