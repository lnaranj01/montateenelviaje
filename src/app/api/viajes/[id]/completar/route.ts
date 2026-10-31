import { alternarCompletado } from "@/lib/dataService";
import {
  conManejoDeErrores,
  leerCuerpo,
  responderOk,
} from "@/lib/http/respuestas";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  esquemaDeviceIdCuerpo,
  esquemaIdViaje,
} from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

type ContextoRutaViaje = {
  params: Promise<{ id: string }>;
};

export const PATCH = conManejoDeErrores(
  async (solicitud: Request, contexto: ContextoRutaViaje) => {
    await exigirSesion();

    const { id } = await contexto.params;
    const idValidado = esquemaIdViaje.parse(id);
    const { deviceId } = await leerCuerpo(solicitud, esquemaDeviceIdCuerpo);
    const viaje = await alternarCompletado(deviceId, idValidado);

    return responderOk(viaje);
  },
);
