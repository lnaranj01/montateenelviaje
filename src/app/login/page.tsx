"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AutenticacionShell } from "@/components/ui/AutenticacionShell";
import { createClient } from "@/lib/supabase/client";

type FormErrors = {
  email?: string;
  password?: string;
  credentials?: string;
};

function getPostLoginPath(): "/viajes" | "/admin/usuarios" {
  return new URLSearchParams(window.location.search).get("next") ===
    "/admin/usuarios"
    ? "/admin/usuarios"
    : "/viajes";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [recoveryNotice, setRecoveryNotice] = useState("");
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
          const message = error.message.toLowerCase().includes("api key")
            ? "La clave publishable de Supabase no es válida."
            : "No se pudo verificar la sesión con Supabase.";
          setErrors({ credentials: message });
        } else if (data.user) {
          router.replace(getPostLoginPath());
        }
      })
      .catch(() => {
        if (isActive) {
          setErrors({
            credentials:
              "No se pudo conectar con Supabase. Revisa su configuración.",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  useEffect(() => {
    const mensaje = sessionStorage.getItem("mensaje-recuperacion-contrasena");

    if (mensaje) {
      setRecoveryNotice(mensaje);
      sessionStorage.removeItem("mensaje-recuperacion-contrasena");
    }
  }, []);

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Escribe tu correo electrónico.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Escribe un correo electrónico válido.";
    }

    if (!password) {
      nextErrors.password = "Escribe tu contraseña.";
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
    setRecoveryNotice("");
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const message = error.message.toLowerCase().includes("api key")
          ? "La clave publishable de Supabase no es válida."
          : "Correo o contraseña incorrectos.";
        setErrors({ credentials: message });
        return;
      }

      router.replace(getPostLoginPath());
    } catch {
      setErrors({
        credentials:
          "No se pudo conectar con Supabase. Revisa la URL y la clave publishable.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AutenticacionShell
      descripcion="Entra para continuar organizando tu próximo viaje."
      hrefMarca="/admin/usuarios"
      titulo="Qué bueno verte"
    >
      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="auth-label" htmlFor="email">
            Correo electrónico
          </label>
          <input
            autoComplete="email"
            className="auth-input"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            type="email"
            value={email}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-peligro" id="email-error">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="auth-label" htmlFor="password">
            Contraseña
          </label>
          <input
            autoComplete="current-password"
            className="auth-input"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            type="password"
            value={password}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <p className="mt-2 text-sm text-peligro" id="password-error">
              {errors.password}
            </p>
          )}
        </div>

        {errors.credentials && (
          <p className="text-sm text-peligro" role="alert">
            {errors.credentials}
          </p>
        )}

        <button className="auth-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>

        {recoveryNotice && (
          <p className="text-center text-sm text-completado" role="status">
            {recoveryNotice}
          </p>
        )}
        <Link
          className="block text-center text-sm font-semibold text-primario transition hover:text-primario/80"
          href="/recuperar-contrasena"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-center text-sm text-texto-suave">
          ¿No tienes cuenta?{" "}
          <Link
            className="font-bold text-primario transition hover:text-primario/80"
            href="/registro"
          >
            Crear cuenta
          </Link>
        </p>
      </form>
    </AutenticacionShell>
  );
}
