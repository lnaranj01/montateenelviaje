import { contarViajes, crearViaje, listarViajes } from "@/lib/dataService";
import {
  conManejoDeErrores,
  leerCuerpo,
  responderOk,
} from "@/lib/http/respuestas";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  esquemaDeviceId,
  esquemaFiltros,
  esquemaViajeConDeviceId,
} from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async (solicitud: Request) => {
  await exigirSesion();

  const parametros = new URL(solicitud.url).searchParams;
  const deviceId = esquemaDeviceId.parse(parametros.get("deviceId"));
  const filtros = esquemaFiltros.parse({
    estado: parametros.get("estado") ?? undefined,
    orden: parametros.get("orden") ?? undefined,
  });
  const [viajes, total] = await Promise.all([
    listarViajes(deviceId, filtros),
    contarViajes(deviceId),
  ]);

  return responderOk({ viajes, total });
});

export const POST = conManejoDeErrores(async (solicitud: Request) => {
  await exigirSesion();

  const cuerpo = await leerCuerpo(solicitud, esquemaViajeConDeviceId);
  const { deviceId, ...datos } = cuerpo;
  const viaje = await crearViaje(deviceId, datos);

  return responderOk(viaje, 201);
});
