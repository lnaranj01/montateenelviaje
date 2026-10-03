"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type FormErrors = {
  email?: string;
  password?: string;
  credentials?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    void Promise.resolve()
      .then(() => createClient().auth.getUser())
      .then(({ data, error }) => {
        if (!isActive) {
          return;
        }

        if (error) {
          const message = error.message.toLowerCase().includes('api key')
            ? 'La clave publishable de Supabase no es válida.'
            : 'No se pudo verificar la sesión con Supabase.';
          setErrors({ credentials: message });
        } else if (data.user) {
          router.replace('/');
        }
      })
      .catch(() => {
        if (isActive) {
          setErrors({ credentials: 'No se pudo conectar con Supabase. Revisa su configuración.' });
        }
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Escribe tu correo electrónico.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Escribe un correo electrónico válido.';
    }

    if (!password) {
      nextErrors.password = 'Escribe tu contraseña.';
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const message = error.message.toLowerCase().includes('api key')
          ? 'La clave publishable de Supabase no es válida.'
          : 'Correo o contraseña incorrectos.';
        setErrors({ credentials: message });
        return;
      }

      router.replace('/');
    } catch {
      setErrors({ credentials: 'No se pudo conectar con Supabase. Revisa la URL y la clave publishable.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-8">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Montate en el viaje
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white">Qué bueno verte</h1>
          <p className="mt-2 text-sm text-slate-400">Entra para continuar organizando tu próximo viaje.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              type="email"
              value={email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-rose-300" id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contraseña"
              type="password"
              value={password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-rose-300" id="password-error">
                {errors.password}
              </p>
            )}
          </div>

          {errors.credentials && <p className="text-sm text-rose-300">{errors.credentials}</p>}

          <button
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>

          <a className="block text-center text-sm font-medium text-cyan-300 transition hover:text-cyan-200" href="#">
            Olvidé mi contraseña
          </a>
        </form>
      </section>
    </main>
  );
}