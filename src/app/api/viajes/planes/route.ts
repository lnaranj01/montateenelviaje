import {
  crearPlanGuardado,
  listarPlanesGuardados,
} from "@/lib/dataService";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  conManejoDeErrores,
  leerCuerpo,
  responderOk,
} from "@/lib/http/respuestas";
import {
  esquemaDeviceId,
  esquemaPlanGuardadoConDeviceId,
} from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async (solicitud: Request) => {
  await exigirSesion();

  const parametros = new URL(solicitud.url).searchParams;
  const deviceId = esquemaDeviceId.parse(parametros.get("deviceId"));
  const planes = await listarPlanesGuardados(deviceId);

  return responderOk({ planes });
});

export const POST = conManejoDeErrores(async (solicitud: Request) => {
  await exigirSesion();

  const cuerpo = await leerCuerpo(solicitud, esquemaPlanGuardadoConDeviceId);
  const { deviceId, ...datos } = cuerpo;
  const plan = await crearPlanGuardado(deviceId, datos);

  return responderOk(plan, 201);
});
