"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type PropsFormulario = {
  token: string;
};

export default function FormularioRestablecerContrasena({
  token,
}: PropsFormulario) {
  const router = useRouter();
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function restablecerContrasena(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setProcesando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/auth/restablecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, contrasena, confirmacion }),
      });
      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setError(resultado?.error ?? "No se pudo cambiar la contraseña.");
        return;
      }

      sessionStorage.setItem(
        "mensaje-recuperacion-contrasena",
        resultado?.message ??
          "La contraseña se actualizó. Ya puedes iniciar sesión.",
      );
      router.replace("/login");
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={restablecerContrasena}>
      <div>
        <label className="auth-label" htmlFor="contrasena">
          Nueva contraseña
        </label>
        <input
          autoComplete="new-password"
          className="auth-input"
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
        <label className="auth-label" htmlFor="confirmacion">
          Confirmar contraseña
        </label>
        <input
          autoComplete="new-password"
          className="auth-input"
          id="confirmacion"
          maxLength={128}
          minLength={8}
          onChange={(evento) => setConfirmacion(evento.target.value)}
          required
          type="password"
          value={confirmacion}
        />
      </div>

      {error && (
        <p className="text-sm text-peligro" role="alert">
          {error}
        </p>
      )}

      <button className="auth-button" disabled={procesando} type="submit">
        {procesando ? "Guardando..." : "Guardar contraseña nueva"}
      </button>
    </form>
  );
}
