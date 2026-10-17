'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type PropsFormulario = {
  token: string;
};

export default function FormularioRestablecerContrasena({ token }: PropsFormulario) {
  const router = useRouter();
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  async function restablecerContrasena(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setProcesando(true);
    setError('');

    try {
      const respuesta = await fetch('/api/auth/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, contrasena, confirmacion }),
      });
      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setError(resultado?.error ?? 'No se pudo cambiar la contraseña.');
        return;
      }

      sessionStorage.setItem(
        'mensaje-recuperacion-contrasena',
        resultado?.message ?? 'La contraseña se actualizó. Ya puedes iniciar sesión.',
      );
      router.replace('/login');
    } catch {
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={restablecerContrasena}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="contrasena">
          Nueva contraseña
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          id="contrasena"
          maxLength={128}
          minLength={8}
          onChange={(evento) => setContrasena(evento.target.value)}
          required
          type="password"
          value={contrasena}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirmacion">
          Confirmar contraseña
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          id="confirmacion"
          maxLength={128}
          minLength={8}
          onChange={(evento) => setConfirmacion(evento.target.value)}
          required
          type="password"
          value={confirmacion}
        />
      </div>

      {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}

      <button
        className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={procesando}
        type="submit"
      >
        {procesando ? 'Guardando...' : 'Guardar contraseña nueva'}
      </button>
    </form>
  );
}