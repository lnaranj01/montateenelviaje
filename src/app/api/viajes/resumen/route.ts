import { obtenerResumen } from "@/lib/dataService";
import { conManejoDeErrores, responderOk } from "@/lib/http/respuestas";
import { exigirSesion } from "@/lib/auth/sesion";
import { esquemaDeviceId } from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const GET = conManejoDeErrores(async (solicitud: Request) => {
  await exigirSesion();

  const deviceId = esquemaDeviceId.parse(
    new URL(solicitud.url).searchParams.get("deviceId"),
  );
  const resumen = await obtenerResumen(deviceId);

  return responderOk(resumen);
});
