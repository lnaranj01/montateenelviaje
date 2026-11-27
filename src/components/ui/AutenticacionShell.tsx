import Link from "next/link";
import type { ReactNode } from "react";

interface AutenticacionShellProps {
  children: ReactNode;
  descripcion: string;
  hrefMarca?: string;
  titulo: string;
}

export function AutenticacionShell({
  children,
  descripcion,
  hrefMarca = "/login",
  titulo,
}: AutenticacionShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fondo-viajes px-4 py-8 text-texto sm:px-6 lg:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_8%_0%,rgba(11,79,108,0.09),transparent_38%),radial-gradient(ellipse_at_100%_100%,rgba(242,161,4,0.08),transparent_34%)]"
      />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-borde bg-superficie shadow-[0_28px_90px_rgba(15,23,42,0.12)] md:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-primario to-[#07384d] p-10 text-white md:flex lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-32 size-96 rounded-full border-[48px] border-white/[0.06]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 top-20 size-48 rounded-full bg-acento/10 blur-2xl"
          />
          <div className="relative py-10">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
              Planea con intención
            </p>
            <p className="max-w-sm text-4xl font-black leading-[1.12] tracking-tight lg:text-[2.75rem]">
              Tu próxima aventura empieza aquí.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/75">
              Reúne tus destinos, fechas y presupuesto para disfrutar el camino
              desde el primer día.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-white/90">
              {[
                "Organiza tus destinos",
                "Controla fechas y presupuesto",
                "Encuentra tus planes cuando los necesites",
              ].map((beneficio) => (
                <div className="flex items-center gap-3" key={beneficio}>
                  <span
                    aria-hidden="true"
                    className="grid size-6 place-items-center rounded-full bg-white/10 text-xs font-bold text-amber-200"
                  >
                    ✓
                  </span>
                  {beneficio}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs font-medium tracking-wide text-white/55">
            Planifica · Presupuesta · Viaja
          </p>
        </aside>

        <div className="p-6 sm:p-10 lg:p-12">
          <Link
            aria-label="Montate en el viaje"
            className="mb-8 inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
            href={hrefMarca}
          >
            <span className="grid size-10 place-items-center rounded-xl bg-acento text-xs font-black text-slate-950">
              MV
            </span>
            <span>
              <span className="block text-sm font-extrabold text-texto">
                Montate en el viaje
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-texto-suave">
                Organiza tu próxima aventura
              </span>
            </span>
          </Link>

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primario">
              Tu espacio de viaje
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-texto sm:text-4xl">
              {titulo}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-texto-suave">
              {descripcion}
            </p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
