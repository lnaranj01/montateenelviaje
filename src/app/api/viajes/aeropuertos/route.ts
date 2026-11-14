import { buscarAeropuertos } from "@/lib/dataService";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  conManejoDeErrores,
  responderOk,
} from "@/lib/http/respuestas";
import { esquemaBusquedaAeropuertos } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async (solicitud: Request) => {
  await exigirSesion();

  const parametros = new URL(solicitud.url).searchParams;
  const consulta = esquemaBusquedaAeropuertos.parse({
    consulta: parametros.get("consulta"),
    tipoRuta: parametros.get("tipoRuta"),
  });
  const aeropuertos = await buscarAeropuertos(
    consulta.consulta,
    consulta.tipoRuta,
  );

  return responderOk({ aeropuertos });
});
