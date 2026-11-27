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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-primario text-white shadow-md shadow-slate-900/10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
        <Link
          className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
          href="/viajes"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-acento text-xs font-black text-slate-950">
            MV
          </span>
          <span>
            <span className="block text-base font-extrabold tracking-tight sm:text-lg">
              Montate en el viaje
            </span>
            <span className="block text-[11px] font-medium text-white/70">
              Organizador de viajes
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="order-3 flex w-full flex-wrap gap-1 border-t border-white/15 pt-3 sm:order-2 sm:ml-auto sm:w-auto sm:border-0 sm:pt-0"
        >
          <Link
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
            href="/viajes"
          >
            Mis viajes
          </Link>
          <Link
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
            href="/planificador"
          >
            Planificador
          </Link>
          <Link
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
            href="/cuenta/contrasena"
          >
            Contraseña
          </Link>
        </nav>

        <div className="ml-auto flex max-w-full items-center gap-3 sm:order-3">
          <p
            className="hidden max-w-48 truncate rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/85 md:block"
            title={email}
          >
            {email}
          </p>
          <Boton
            className="border-white/40 px-3 text-white hover:bg-white/10 sm:px-4"
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
          <Aviso tipo="error">{mensajeError}</Aviso>
        </div>
      )}
    </header>
  );
}
