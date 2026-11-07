"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { FiltrosViajes } from "@/components/viajes/FiltrosViajes";
import { FormularioViaje } from "@/components/viajes/FormularioViaje";
import { ListaViajes } from "@/components/viajes/ListaViajes";
import { ResumenViajes } from "@/components/viajes/ResumenViajes";
import type { AccionViaje } from "@/components/viajes/TarjetaViaje";
import type { Viaje } from "@/lib/datos/tipos";
import type { EstadoViaje } from "@/lib/reglas/viaje";

interface PaginaViajesClienteProps {
  estado: EstadoViaje | "";
  orden: "inicio" | "reciente";
}

export function PaginaViajesCliente({
  estado,
  orden,
}: PaginaViajesClienteProps) {
  const [viajeEnEdicion, setViajeEnEdicion] = useState<Viaje | null>(null);
  const [revisionLista, setRevisionLista] = useState(0);
  const [mensaje, setMensaje] = useState("");

  function alGuardar(modo: "crear" | "editar") {
    setViajeEnEdicion(null);
    setRevisionLista((revision) => revision + 1);
    setMensaje(
      modo === "crear"
        ? "Viaje guardado correctamente."
        : "Viaje actualizado correctamente.",
    );
  }

  function alCambiar(accion: AccionViaje, viaje: Viaje) {
    setRevisionLista((revision) => revision + 1);
    setMensaje(
      accion === "eliminar"
        ? `Se eliminó el viaje a ${viaje.destino}.`
        : accion === "completar"
          ? `El viaje a ${viaje.destino} se marcó como completado.`
          : `El viaje a ${viaje.destino} volvió a Planeado.`,
    );

    if (accion === "eliminar" && viajeEnEdicion?.id === viaje.id) {
      setViajeEnEdicion(null);
    }
  }

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
            Organiza tus destinos, fechas y presupuesto en un solo lugar.
          </p>
        </section>

        <section aria-labelledby="titulo-formulario" id="formulario-viaje">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-texto" id="titulo-formulario">
              {viajeEnEdicion ? "Editar viaje" : "Agregar un viaje"}
            </h2>
            <p className="mt-1 text-sm text-texto-suave">
              Completa los datos de tu próximo destino.
            </p>
          </div>
          <Tarjeta>
            <FormularioViaje
              alInteractuar={() => setMensaje("")}
              alCancelarEdicion={() => {
                setViajeEnEdicion(null);
                setMensaje("");
              }}
              alGuardar={alGuardar}
              key={viajeEnEdicion?.id ?? "nuevo"}
              viaje={viajeEnEdicion}
            />
          </Tarjeta>
        </section>

        {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}

        <section aria-label="Lista de viajes" className="grid gap-5">
          <ResumenViajes deviceRevision={revisionLista} />
          <FiltrosViajes estado={estado} orden={orden} />
          <ListaViajes
            alCambiar={alCambiar}
            alEditar={(viaje) => {
              setViajeEnEdicion(viaje);
              setMensaje("");
            }}
            estado={estado || undefined}
            orden={orden}
            revision={revisionLista}
          />
        </section>
      </div>
    </main>
  );
}
