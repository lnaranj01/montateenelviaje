import { z } from 'zod';
import {
  actualizarContrasena,
  buscarTokenVigente,
  invalidarTokensPendientes,
  marcarTokenComoUsado,
} from '@/lib/dataService';
import { calcularHashToken } from '@/lib/tokenRecuperacion';

const esquemaRestablecimiento = z
  .object({
    token: z.string().regex(/^[a-fA-F0-9]{64}$/),
    contrasena: z.string().min(8),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    message: 'La confirmación no coincide con la contraseña.',
    path: ['confirmacion'],
  });

const mensajeEnlaceInvalido = 'El enlace no es válido o ya venció.';

export async function POST(solicitud: Request) {
  const resultadoValidacion = esquemaRestablecimiento.safeParse(await solicitud.json().catch(() => null));

  if (!resultadoValidacion.success) {
    const errores = resultadoValidacion.error.issues;
    const tokenInvalido = errores.some((error) => error.path[0] === 'token');
    const confirmacionInvalida = errores.some((error) => error.path[0] === 'confirmacion');
    const mensaje = tokenInvalido
      ? mensajeEnlaceInvalido
      : confirmacionInvalida
        ? 'La confirmación no coincide con la contraseña.'
        : 'La contraseña debe tener al menos 8 caracteres.';

    return Response.json({ error: mensaje }, { status: 400 });
  }

  try {
    const tokenHash = calcularHashToken(resultadoValidacion.data.token);
    const restablecimiento = await buscarTokenVigente(tokenHash);

    if (!restablecimiento || !(await marcarTokenComoUsado(restablecimiento.token_id))) {
      return Response.json({ error: mensajeEnlaceInvalido }, { status: 400 });
    }

    await actualizarContrasena(restablecimiento.usuario_id, resultadoValidacion.data.contrasena);
    await invalidarTokensPendientes(restablecimiento.usuario_id);

    return Response.json({ message: 'La contraseña se actualizó. Ya puedes iniciar sesión.' });
  } catch {
    return Response.json({ error: 'No se pudo cambiar la contraseña. Solicita un enlace nuevo.' }, { status: 500 });
  }
}