import { z } from "zod";
import { ESTADO_HTTP, ErrorDeNegocio } from "@/lib/reglas/errores";
import type { CodigoError } from "@/lib/reglas/errores";

type ErrorPostgres = {
  code: string;
  constraint?: string;
};

function esErrorPostgres(error: unknown): error is ErrorPostgres {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

export function responderOk<T>(datos: T, estado = 200): Response {
  return Response.json(
    { ok: true, datos },
    {
      status: estado,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function responderError(error: unknown): Response {
  let codigo: CodigoError = "ERROR_INTERNO";
  let mensaje: string | undefined;
  let detalles: unknown = null;
  let estado = ESTADO_HTTP.ERROR_INTERNO;

  if (error instanceof ErrorDeNegocio) {
    codigo = error.codigo;
    mensaje = error.message;
    detalles = error.detalles ?? null;
    estado = ESTADO_HTTP[codigo];
  } else if (error instanceof z.ZodError) {
    codigo = "DATOS_INVALIDOS";
    mensaje = "Revise los datos ingresados.";
    detalles = error.flatten();
    estado = ESTADO_HTTP.DATOS_INVALIDOS;
  } else if (esErrorPostgres(error) && error.code === "23514") {
    if (error.constraint === "viajes_fechas_ok") {
      codigo = "FECHA_FIN_ANTERIOR";
    } else {
      codigo = "DATOS_INVALIDOS";
    }
    estado = ESTADO_HTTP[codigo];
  } else {
    console.error("Error interno al procesar una solicitud de viajes.", error);
  }

  return Response.json(
    {
      ok: false,
      error: {
        codigo,
        mensaje: mensaje ?? new ErrorDeNegocio(codigo).message,
        detalles,
      },
    },
    {
      status: estado,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

type ManejadorRuta<Argumentos extends unknown[]> = (
  ...argumentos: Argumentos
) => Promise<Response>;

export function conManejoDeErrores<Argumentos extends unknown[]>(
  manejador: ManejadorRuta<Argumentos>,
): ManejadorRuta<Argumentos> {
  return async (...argumentos) => {
    try {
      return await manejador(...argumentos);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo<T extends z.ZodType>(
  solicitud: Request,
  esquema: T,
): Promise<z.output<T>> {
  let cuerpo: unknown;

  try {
    cuerpo = await solicitud.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ErrorDeNegocio(
        "DATOS_INVALIDOS",
        "El cuerpo de la solicitud debe ser JSON válido.",
      );
    }

    throw error;
  }

  return esquema.parseAsync(cuerpo);
}
