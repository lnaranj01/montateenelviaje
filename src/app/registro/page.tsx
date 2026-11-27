"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AutenticacionShell } from "@/components/ui/AutenticacionShell";
import { createClient } from "@/lib/supabase/client";

export default function RegistrationPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
          router.replace("/");
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
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 12 || password.length > 128) {
      setErrorMessage("La contraseña debe tener entre 12 y 128 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
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
        setErrorMessage(
          "No se pudo crear la cuenta. Comprueba el correo y vuelve a intentarlo.",
        );
        return;
      }

      if (data.session) {
        router.replace("/");
        return;
      }

      setSuccessMessage(
        "Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.",
      );
      setDisplayName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage(
        "No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <AutenticacionShell
      descripcion="Regístrate para empezar a organizar tus viajes."
      titulo="Crear cuenta"
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div>
          <label className="auth-label" htmlFor="display-name">
            Nombre
          </label>
          <input
            autoComplete="name"
            className="auth-input"
            id="display-name"
            maxLength={100}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
        </div>

        <div>
          <label className="auth-label" htmlFor="email">
            Correo electrónico
          </label>
          <input
            autoComplete="email"
            className="auth-input"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <div>
          <label className="auth-label" htmlFor="password">
            Contraseña
          </label>
          <input
            autoComplete="new-password"
            className="auth-input"
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
          <label className="auth-label" htmlFor="confirm-password">
            Confirmar contraseña
          </label>
          <input
            autoComplete="new-password"
            className="auth-input"
            id="confirm-password"
            maxLength={128}
            minLength={12}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-peligro" role="alert">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-completado" role="status">
            {successMessage}
          </p>
        )}

        <button className="auth-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="text-center text-sm text-texto-suave">
          ¿Ya tienes cuenta?{" "}
          <Link
            className="font-bold text-primario transition hover:text-primario/80"
            href="/login"
          >
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AutenticacionShell>
  );
}
