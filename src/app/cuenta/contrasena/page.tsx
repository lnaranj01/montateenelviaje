"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    void createClient()
      .auth.getUser()
      .then(({ data, error }) => {
        if (!isActive) {
          return;
        }

        if (error || !data.user) {
          router.replace('/login');
          return;
        }

        setIsReady(true);
      })
      .catch(() => {
        if (isActive) {
          router.replace('/login');
        }
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 12 || newPassword.length > 128) {
      setErrorMessage('La contraseña debe tener entre 12 y 128 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createClient().auth.updateUser({ password: newPassword });

      if (error) {
        setErrorMessage('No se pudo cambiar la contraseña. Inténtalo de nuevo.');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Tu contraseña se cambió correctamente.');
    } catch {
      setErrorMessage('No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-8">
        <Link className="mb-8 inline-block text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href="/">
          Volver al inicio
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Cambiar contraseña</h1>
        <p className="mt-2 text-sm text-slate-400">Elige una contraseña nueva para tu cuenta.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="new-password">
              Nueva contraseña
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="new-password"
              maxLength={128}
              minLength={12}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirm-password">
              Confirmar contraseña nueva
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="confirm-password"
              maxLength={128}
              minLength={12}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </div>

          {errorMessage && <p className="text-sm text-rose-300" role="alert">{errorMessage}</p>}
          {successMessage && <p className="text-sm text-emerald-300" role="status">{successMessage}</p>}

          <button
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar contraseña nueva'}
          </button>
        </form>
      </section>
    </main>
  );
}