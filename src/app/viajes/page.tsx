import { ListaViajes } from "@/components/viajes/ListaViajes";

export default function PaginaViajes() {
  return (
    <main className="min-h-screen bg-fondo-viajes px-4 py-8 text-texto sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <section aria-labelledby="titulo-viajes">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primario">
            Tus planes, en un solo lugar
          </p>
          <h1
            className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl"
            id="titulo-viajes"
          >
            Tus viajes
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-texto-suave">
            Revisa tus destinos, fechas y presupuesto. Pronto podrás crear y
            editar tus viajes desde aquí.
          </p>
        </section>

        <section aria-label="Lista de viajes">
          <ListaViajes />
        </section>
      </div>
    </main>
  );
}
