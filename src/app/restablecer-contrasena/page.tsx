import Link from 'next/link';
import FormularioRestablecerContrasena from './formulario';

type PropsPagina = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function RestablecerContrasenaPage({ searchParams }: PropsPagina) {
  const parametros = await searchParams;
  const token = Array.isArray(parametros.token) ? parametros.token[0] : parametros.token;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-8">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Montate en el viaje</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Crear nueva contraseña</h1>
          <p className="mt-2 text-sm text-slate-400">Elige una contraseña nueva para tu cuenta.</p>
        </div>

        {token ? (
          <FormularioRestablecerContrasena token={token} />
        ) : (
          <>
            <p className="mb-6 text-sm text-rose-300" role="alert">El enlace no es válido o ya venció.</p>
            <Link className="block text-center text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href="/recuperar-contrasena">
              Solicitar otro enlace
            </Link>
          </>
        )}
      </section>
    </main>
  );
}