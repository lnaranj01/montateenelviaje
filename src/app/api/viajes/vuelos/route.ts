import { buscarVuelosAmadeus } from "@/lib/dataService";
import { exigirSesion } from "@/lib/auth/sesion";
import { conManejoDeErrores, responderOk } from "@/lib/http/respuestas";
import { esquemaBusquedaVuelos } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async (solicitud: Request) => {
  await exigirSesion();

  const parametros = new URL(solicitud.url).searchParams;
  const consulta = esquemaBusquedaVuelos.parse({
    origen: parametros.get("origen"),
    destino: parametros.get("destino"),
    fechaIda: parametros.get("fechaIda"),
    fechaRegreso: parametros.get("fechaRegreso") ?? undefined,
    viajeros: parametros.get("viajeros"),
    tipoRuta: parametros.get("tipoRuta"),
  });
  const ofertas = await buscarVuelosAmadeus(consulta);

  return responderOk({ ofertas });
});
