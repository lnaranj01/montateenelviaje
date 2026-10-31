import { editarViaje, eliminarViaje, obtenerViaje } from "@/lib/dataService";
import {
  conManejoDeErrores,
  leerCuerpo,
  responderOk,
} from "@/lib/http/respuestas";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  esquemaDeviceId,
  esquemaDeviceIdCuerpo,
  esquemaIdViaje,
  esquemaViajeConDeviceId,
} from "@/lib/validacion/esquemas";

export const dynamic = "force-dynamic";

type ContextoRutaViaje = {
  params: Promise<{ id: string }>;
};

export const GET = conManejoDeErrores(
  async (solicitud: Request, contexto: ContextoRutaViaje) => {
    await exigirSesion();

    const { id } = await contexto.params;
    const idValidado = esquemaIdViaje.parse(id);
    const deviceId = esquemaDeviceId.parse(
      new URL(solicitud.url).searchParams.get("deviceId"),
    );
    const viaje = await obtenerViaje(deviceId, idValidado);

    return responderOk(viaje);
  },
);

export const PATCH = conManejoDeErrores(
  async (solicitud: Request, contexto: ContextoRutaViaje) => {
    await exigirSesion();

    const { id } = await contexto.params;
    const idValidado = esquemaIdViaje.parse(id);
    const cuerpo = await leerCuerpo(solicitud, esquemaViajeConDeviceId);
    const { deviceId, ...datos } = cuerpo;
    const viaje = await editarViaje(deviceId, idValidado, datos);

    return responderOk(viaje);
  },
);

export const DELETE = conManejoDeErrores(
  async (solicitud: Request, contexto: ContextoRutaViaje) => {
    await exigirSesion();

    const { id } = await contexto.params;
    const idValidado = esquemaIdViaje.parse(id);
    const { deviceId } = await leerCuerpo(solicitud, esquemaDeviceIdCuerpo);
    await eliminarViaje(deviceId, idValidado);

    return responderOk({ eliminado: true });
  },
);
