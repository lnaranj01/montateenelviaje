import { getToken } from '@vercel/connect';
import { Resend } from 'resend';

type DatosCorreo = {
  para: string;
  asunto: string;
  html: string;
};

type ResultadoCorreo =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function obtenerClaveResend(): Promise<string> {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }

  return getToken('resend/montateenelviaje', { subject: { type: 'app' } });
}

export async function enviarCorreo({ para, asunto, html }: DatosCorreo): Promise<ResultadoCorreo> {
  try {
    const clave = await obtenerClaveResend();
    const resend = new Resend(clave);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: para,
      subject: asunto,
      html,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    if (!data?.id) {
      return { ok: false, error: 'El servicio de correo no devolvió un identificador de envío.' };
    }

    return { ok: true, id: data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo enviar el correo.',
    };
  }
}