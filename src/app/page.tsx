"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const features = [
  "Planifica rutas con estilo",
  "Organiza tus viajes por etapas",
  "Guarda tus destinos favoritos",
  "Todo listo para crecer con tu negocio",
];

export default function HomePage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isActive = true;

    try {
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

          setIsAdmin(data.user.app_metadata.role === "admin");
          setIsReady(true);
        })
        .catch(() => {
          if (isActive) {
            router.replace("/login");
          }
        });
    } catch {
      router.replace("/login");
    }

    return () => {
      isActive = false;
    };
  }, [router]);

  if (!isReady) {
    return null;
  }

  async function handleSignOut() {
    const { error } = await createClient().auth.signOut();

    if (!error) {
      router.replace("/login");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-fondo-viajes px-4 py-5 text-texto sm:px-8 sm:py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(11,79,108,0.08),transparent_35%),radial-gradient(ellipse_at_100%_90%,rgba(242,161,4,0.08),transparent_30%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-borde bg-superficie px-4 py-3 shadow-sm sm:px-5">
          <Link
            className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
            href="/viajes"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-primario text-xs font-black text-white">
              MV
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-texto">
                Montate en el viaje
              </span>
              <span className="block text-xs text-texto-suave">
                Tu espacio para planear
              </span>
            </span>
          </Link>
          <nav
            aria-label="Cuenta"
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <Link
              className="text-sm font-semibold text-texto-suave transition hover:text-primario"
              href="/cuenta/contrasena"
            >
              Cambiar contraseña
            </Link>
            {isAdmin && (
              <Link
                className="text-sm font-semibold text-texto-suave transition hover:text-primario"
                href="/admin/usuarios"
              >
                Usuarios
              </Link>
            )}
            <button
              className="rounded-lg border border-borde px-3 py-2 text-sm font-semibold text-texto transition hover:border-peligro/40 hover:bg-red-50 hover:text-peligro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
              onClick={handleSignOut}
              type="button"
            >
              Cerrar sesión
            </button>
          </nav>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative flex min-h-[420px] flex-col items-start justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primario to-[#07384d] p-7 text-white shadow-[0_20px_50px_rgba(11,79,108,0.2)] sm:p-10 lg:p-12"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full border-[40px] border-white/[0.06]"
            />
            <p className="relative mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-amber-100">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-acento"
              />
              Tu viaje empieza aquí
            </p>
            <h1 className="relative max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Bienvenido a tu próximo viaje.
            </h1>
            <p className="relative mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Ya estás dentro de la app y puedes empezar a organizar tus rutas,
              destinos y planes de forma centralizada.
            </p>
            <div className="relative mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-acento px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                href="/viajes"
              >
                Abrir organizador de viajes
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                href="/planificador"
              >
                Ir al planificador
              </Link>
            </div>
          </motion.section>

          <section
            aria-label="Lo que puedes organizar"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 * index, duration: 0.35 }}
                className="flex items-center gap-4 rounded-xl border border-borde bg-superficie p-4 shadow-sm"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primario-suave text-sm font-black text-primario">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-semibold leading-5 text-texto">
                  {feature}
                </p>
              </motion.div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
