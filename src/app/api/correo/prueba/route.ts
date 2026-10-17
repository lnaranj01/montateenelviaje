import { z } from 'zod';
import { enviarCorreo } from '@/lib/correo';

const esquemaSolicitud = z.object({
  para: z.email(),
});

export async function POST(solicitud: Request) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'No encontrado.' }, { status: 404 });
  }

  const resultadoValidacion = esquemaSolicitud.safeParse(await solicitud.json().catch(() => null));

  if (!resultadoValidacion.success) {
    return Response.json({ error: 'Escribe una dirección de correo válida.' }, { status: 400 });
  }

  const resultadoEnvio = await enviarCorreo({
    para: resultadoValidacion.data.para,
    asunto: 'Prueba de correo',
    html: '<p>Este es un correo de prueba de Resend.</p>',
  });

  if (!resultadoEnvio.ok) {
    return Response.json({ error: resultadoEnvio.error }, { status: 500 });
  }

  return Response.json({ message: 'Correo enviado', id: resultadoEnvio.id });
}