"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AutenticacionShell } from "@/components/ui/AutenticacionShell";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
          router.replace("/login");
          return;
        }

        setIsReady(true);
      })
      .catch(() => {
        if (isActive) {
          router.replace("/login");
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

    if (newPassword.length < 12 || newPassword.length > 128) {
      setErrorMessage("La contraseña debe tener entre 12 y 128 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createClient().auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(
          "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
        );
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Tu contraseña se cambió correctamente.");
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
      descripcion="Elige una contraseña nueva para tu cuenta."
      titulo="Cambiar contraseña"
    >
      <Link
        className="mb-8 inline-block text-sm font-semibold text-primario transition hover:text-primario/80"
        href="/"
      >
        Volver al inicio
      </Link>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div>
          <label className="auth-label" htmlFor="new-password">
            Nueva contraseña
          </label>
          <input
            autoComplete="new-password"
            className="auth-input"
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
          <label className="auth-label" htmlFor="confirm-password">
            Confirmar contraseña nueva
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
          {isSubmitting ? "Guardando..." : "Guardar contraseña nueva"}
        </button>
      </form>
    </AutenticacionShell>
  );
}
