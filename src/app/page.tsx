"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_STORAGE_KEY = 'montateenelviaje-auth';

const features = [
  'Planifica rutas con estilo',
  'Organiza tus viajes por etapas',
  'Guarda tus destinos favoritos',
  'Todo listo para crecer con tu negocio',
];

export default function HomePage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isAuthenticated = window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true';

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    setIsReady(true);
  }, [router]);

  if (!isReady) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur"
      >
        <div className="mb-8 inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Montate en el viaje
        </div>

        <h1 className="mb-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Bienvenido a tu próximo viaje.
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-slate-300">
          Ya estás dentro de la app y puedes empezar a organizar tus rutas, destinos y planes de forma centralizada.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 * index, duration: 0.35 }}
              className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-sm text-slate-200"
            >
              {feature}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </main>
  );
}
