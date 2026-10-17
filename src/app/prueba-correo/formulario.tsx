'use client';

import { useState, type FormEvent } from 'react';

export default function FormularioPruebaCorreo() {
  const [para, setPara] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [idEnvio, setIdEnvio] = useState('');
  const [esError, setEsError] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setMensaje('');
    setIdEnvio('');
    setEsError(false);

    try {
      const respuesta = await fetch('/api/correo/prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ para }),
      });
      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setEsError(true);
        setMensaje(resultado?.error ?? 'No se pudo enviar el correo.');
        return;
      }

      setMensaje('Correo enviado. Resend aceptó la solicitud; esto no confirma la entrega.');
      setIdEnvio(typeof resultado?.id === 'string' ? resultado.id : '');
    } catch {
      setEsError(true);
      setMensaje('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={manejarEnvio}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="para">
          Correo electrónico de destino
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          id="para"
          onChange={(evento) => setPara(evento.target.value)}
          required
          type="email"
          value={para}
        />
      </div>

      {mensaje && (
        <div className="space-y-2" role={esError ? 'alert' : 'status'}>
          <p className={`text-sm ${esError ? 'text-rose-300' : 'text-emerald-300'}`}>{mensaje}</p>
          {idEnvio && (
            <p className="break-all text-xs text-slate-400">
              ID de envío para buscar en los registros de Resend: <code>{idEnvio}</code>
            </p>
          )}
        </div>
      )}

      <button
        className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={enviando}
        type="submit"
      >
        {enviando ? 'Enviando...' : 'Enviar prueba'}
      </button>
    </form>
  );
}