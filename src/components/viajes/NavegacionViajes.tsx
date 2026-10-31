"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { createClient } from "@/lib/supabase/client";

interface NavegacionViajesProps {
  email: string;
}

export function NavegacionViajes({ email }: NavegacionViajesProps) {
  const router = useRouter();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  async function cerrarSesion() {
    setCerrandoSesion(true);
    setMensajeError("");

    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setMensajeError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("No se pudo cerrar la sesión del usuario.", error);
      setMensajeError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setCerrandoSesion(false);
    }
  }

  return (
    <header className="bg-primario text-white shadow-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          className="rounded-sm text-lg font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento sm:text-xl"
          href="/viajes"
        >
          Organizador de Viajes
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <p
            className="max-w-full truncate text-sm text-white/90"
            title={email}
          >
            {email}
          </p>
          <Boton
            className="border-white/50 text-white hover:bg-white/10"
            cargando={cerrandoSesion}
            onClick={cerrarSesion}
            variante="fantasma"
          >
            Cerrar sesión
          </Boton>
        </div>
      </div>
      {mensajeError && (
        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
          <Aviso className="border-white/30 bg-white text-peligro" tipo="error">
            {mensajeError}
          </Aviso>
        </div>
      )}
    </header>
  );
}
