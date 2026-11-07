import { exigirSesion } from "@/lib/auth/sesion";
import { eliminarPlanGuardado } from "@/lib/dataService";
import {
  conManejoDeErrores,
  leerCuerpo,
  responderOk,
} from "@/lib/http/respuestas";
import {
  esquemaDeviceIdCuerpo,
  esquemaIdViaje,
} from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

export const DELETE = conManejoDeErrores(
  async (
    solicitud: Request,
    contexto: RouteContext<"/api/viajes/planes/[id]">,
  ) => {
    await exigirSesion();

    const { id } = await contexto.params;
    const idValidado = esquemaIdViaje.parse(id);
    const { deviceId } = await leerCuerpo(solicitud, esquemaDeviceIdCuerpo);
    await eliminarPlanGuardado(deviceId, idValidado);

    return responderOk({ eliminado: true });
  },
);
