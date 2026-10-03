import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/auth/admin';
import UserManager from './user-manager';

export default async function UsersPage() {
  const context = await getAdminContext();

  if (!context.ok) {
    redirect(context.status === 401 ? '/login' : '/');
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <Link className="text-sm font-semibold text-cyan-300 hover:text-cyan-200" href="/">
              Montate en el viaje
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-white">Usuarios</h1>
          </div>
          <Link className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400 hover:text-white" href="/">
            Volver al inicio
          </Link>
        </header>
        <UserManager />
      </div>
    </main>
  );
}