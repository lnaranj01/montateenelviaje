'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function enviarSolicitud(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setProcesando(true);
    setMensaje('');
    setEsError(false);

    try {
      const respuesta = await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setEsError(true);
        setMensaje(resultado?.error ?? 'No se pudo procesar la solicitud.');
        return;
      }

      setMensaje(resultado?.message ?? 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.');
    } catch {
      setEsError(true);
      setMensaje('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-8">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Montate en el viaje</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-400">Escribe el correo asociado a tu cuenta.</p>
        </div>

        <form className="space-y-5" onSubmit={enviarSolicitud}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="email"
              onChange={(evento) => setEmail(evento.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          {mensaje && <p className={`text-sm ${esError ? 'text-rose-300' : 'text-emerald-300'}`} role={esError ? 'alert' : 'status'}>{mensaje}</p>}

          <button
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={procesando}
            type="submit"
          >
            {procesando ? 'Enviando...' : 'Enviar enlace'}
          </button>

          <Link className="block text-center text-sm font-medium text-cyan-300 transition hover:text-cyan-200" href="/login">
            Volver al inicio de sesión
          </Link>
        </form>
      </section>
    </main>
  );
}