import { notFound } from 'next/navigation';
import FormularioPruebaCorreo from './formulario';

export default function PruebaCorreoPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Montate en el viaje
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white">Prueba de correo</h1>
        <p className="mt-2 text-sm text-slate-400">Envía un mensaje de prueba con Resend.</p>
        <FormularioPruebaCorreo />
      </section>
    </main>
  );
}