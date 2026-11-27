import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth/admin";
import UserManager from "./user-manager";

export default async function UsersPage() {
  const context = await getAdminContext();

  if (!context.ok) {
    redirect(context.status === 401 ? "/login?next=%2Fadmin%2Fusuarios" : "/");
  }

  return (
    <main className="min-h-screen bg-fondo-viajes px-4 py-8 text-texto sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-borde pb-6">
          <div>
            <Link
              className="text-sm font-bold text-primario transition hover:text-primario/80"
              href="/"
            >
              ← Montate en el viaje
            </Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primario">
              Administración
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-texto">
              Usuarios
            </h1>
            <p className="mt-2 text-sm text-texto-suave">
              Administra las cuentas y sus niveles de acceso.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-borde bg-superficie px-4 py-2 text-sm font-semibold text-texto transition hover:border-primario hover:bg-primario-suave"
            href="/"
          >
            Inicio
          </Link>
        </header>
        <UserManager />
      </div>
    </main>
  );
}
