import { z } from 'zod';
import { buscarUsuarioPorCorreo, contarSolicitudesRecientes, crearTokenRecuperacion } from '@/lib/dataService';
import { enviarCorreo } from '@/lib/correo';
import { plantillaRecuperacion } from '@/lib/plantillasCorreo';
import { calcularHashToken, generarToken } from '@/lib/tokenRecuperacion';
import { obtenerUrlBase } from '@/lib/urlBase';

const esquemaSolicitud = z.object({
  email: z.email(),
});

const mensajePublico = 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.';

export async function POST(solicitud: Request) {
  const resultadoValidacion = esquemaSolicitud.safeParse(await solicitud.json().catch(() => null));

  if (!resultadoValidacion.success) {
    return Response.json({ error: 'Escribe un correo electrónico válido.' }, { status: 400 });
  }

  try {
    const usuario = await buscarUsuarioPorCorreo(resultadoValidacion.data.email);

    if (usuario && (await contarSolicitudesRecientes(usuario.id)) < 3) {
      const token = generarToken();
      const tokenHash = calcularHashToken(token);
      const solicitudCreada = await crearTokenRecuperacion(usuario.id, tokenHash);

      if (solicitudCreada) {
        const enlace = `${obtenerUrlBase()}/restablecer-contrasena?token=${token}`;
        await enviarCorreo({
          para: usuario.correo,
          asunto: 'Restablecer contraseña',
          html: plantillaRecuperacion(enlace),
        });
      }
    }
  } catch {
    return Response.json({ message: mensajePublico });
  }

  return Response.json({ message: mensajePublico });
}