"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegistrationPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!isActive) {
          return;
        }

        if (data.user) {
          router.replace('/');
          return;
        }

        setIsReady(true);
      })
      .catch(() => {
        if (isActive) {
          setIsReady(true);
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

    if (password.length < 12 || password.length > 128) {
      setErrorMessage('La contraseña debe tener entre 12 y 128 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: displayName.trim() } },
      });

      if (error) {
        setErrorMessage('No se pudo crear la cuenta. Comprueba el correo y vuelve a intentarlo.');
        return;
      }

      if (data.session) {
        router.replace('/');
        return;
      }

      setSuccessMessage('Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.');
      setDisplayName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
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
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Montate en el viaje
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-400">Regístrate para empezar a organizar tus viajes.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="display-name">
              Nombre
            </label>
            <input
              autoComplete="name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="display-name"
              maxLength={100}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              value={displayName}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
              Contraseña
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="password"
              maxLength={128}
              minLength={12}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirm-password">
              Confirmar contraseña
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
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
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link className="font-semibold text-cyan-300 transition hover:text-cyan-200" href="/login">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}