"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AutenticacionShell } from "@/components/ui/AutenticacionShell";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function enviarSolicitud(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setProcesando(true);
    setMensaje("");
    setEsError(false);

    try {
      const respuesta = await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setEsError(true);
        setMensaje(resultado?.error ?? "No se pudo procesar la solicitud.");
        return;
      }

      setMensaje(
        resultado?.message ??
          "Si el correo está registrado, recibirás un enlace para restablecer la contraseña.",
      );
    } catch {
      setEsError(true);
      setMensaje("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <AutenticacionShell
      descripcion="Escribe el correo asociado a tu cuenta."
      titulo="Recuperar contraseña"
    >
      <form className="grid gap-5" onSubmit={enviarSolicitud}>
        <div>
          <label className="auth-label" htmlFor="email">
            Correo electrónico
          </label>
          <input
            autoComplete="email"
            className="auth-input"
            id="email"
            onChange={(evento) => setEmail(evento.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        {mensaje && (
          <p
            className={`text-sm ${esError ? "text-peligro" : "text-completado"}`}
            role={esError ? "alert" : "status"}
          >
            {mensaje}
          </p>
        )}

        <button className="auth-button" disabled={procesando} type="submit">
          {procesando ? "Enviando..." : "Enviar enlace"}
        </button>

        <Link
          className="block text-center text-sm font-semibold text-primario transition hover:text-primario/80"
          href="/login"
        >
          Volver al inicio de sesión
        </Link>
      </form>
    </AutenticacionShell>
  );
}
