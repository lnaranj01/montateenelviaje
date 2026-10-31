"use client";

import { useEffect, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { ContadorViajes } from "@/components/viajes/ContadorViajes";
import { TarjetaViaje } from "@/components/viajes/TarjetaViaje";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import type { Viaje } from "@/lib/datos/tipos";

type RespuestaLista = {
  ok: true;
  datos: {
    viajes: Viaje[];
    total: number;
  };
};

function esViaje(valor: unknown): valor is Viaje {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const viaje = valor as Record<string, unknown>;

  return (
    typeof viaje.id === "string" &&
    typeof viaje.destino === "string" &&
    typeof viaje.fechaInicio === "string" &&
    typeof viaje.fechaFin === "string" &&
    typeof viaje.presupuesto === "number" &&
    Number.isSafeInteger(viaje.presupuesto) &&
    typeof viaje.completado === "boolean" &&
    (viaje.estado === "Planeado" || viaje.estado === "Completado") &&
    typeof viaje.duracionDias === "number" &&
    Number.isInteger(viaje.duracionDias)
  );
}

function esRespuestaLista(valor: unknown): valor is RespuestaLista {
  if (typeof valor !== "object" || valor === null || !("ok" in valor)) {
    return false;
  }

  const respuesta = valor as {
    ok: unknown;
    datos?: { viajes?: unknown; total?: unknown };
  };

  return (
    respuesta.ok === true &&
    Array.isArray(respuesta.datos?.viajes) &&
    respuesta.datos.viajes.every(esViaje) &&
    typeof respuesta.datos.total === "number" &&
    Number.isSafeInteger(respuesta.datos.total) &&
    respuesta.datos.total >= 0
  );
}

function mensajeDeErrorApi(valor: unknown): string | null {
  if (typeof valor !== "object" || valor === null || !("error" in valor)) {
    return null;
  }

  const error = valor.error;
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error &&
    typeof error.mensaje === "string"
  ) {
    return error.mensaje;
  }

  return null;
}

export function ListaViajes() {
  const deviceId = useDeviceId();
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [mensajeError, setMensajeError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const idDispositivo = deviceId;
    if (!idDispositivo) {
      return;
    }

    const controlador = new AbortController();

    async function cargarViajes(idDispositivo: string) {
      try {
        const respuesta = await fetch(
          `/api/viajes?deviceId=${encodeURIComponent(idDispositivo)}`,
          { cache: "no-store", signal: controlador.signal },
        );
        let cuerpo: unknown;

        try {
          cuerpo = await respuesta.json();
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new Error("El servidor devolvió una respuesta inválida.");
          }
          throw error;
        }

        if (!respuesta.ok) {
          throw new Error(
            mensajeDeErrorApi(cuerpo) ??
              "No se pudieron cargar tus viajes. Inténtalo de nuevo.",
          );
        }

        if (!esRespuestaLista(cuerpo)) {
          throw new Error("El servidor devolvió datos de viajes inválidos.");
        }

        setViajes(cuerpo.datos.viajes);
        setTotal(cuerpo.datos.total);
        setEstado("listo");
        setMensajeError("");
      } catch (error) {
        if (controlador.signal.aborted) {
          return;
        }

        setMensajeError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar tus viajes. Inténtalo de nuevo.",
        );
        setEstado("error");
      }
    }

    void cargarViajes(idDispositivo);
    return () => controlador.abort();
  }, [deviceId, intento]);

  if (!deviceId || estado === "cargando") {
    return (
      <div
        aria-label="Cargando viajes"
        aria-live="polite"
        className="grid gap-4 md:grid-cols-2"
        role="status"
      >
        <div className="h-52 animate-pulse rounded-lg border border-borde bg-white" />
        <div className="hidden h-52 animate-pulse rounded-lg border border-borde bg-white md:block" />
        <span className="sr-only">Cargando tus viajes</span>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="grid gap-4">
        <Aviso tipo="error">{mensajeError}</Aviso>
        <div>
          <Boton
            onClick={() => {
              setEstado("cargando");
              setIntento((actual) => actual + 1);
            }}
            variante="secundario"
          >
            Intentar de nuevo
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <ContadorViajes total={total ?? 0} />
      {viajes.length === 0 ? (
        <EstadoVacio
          descripcion="Aún no has registrado viajes. Completa el formulario de arriba para agregar el primero."
          titulo="Tu próxima aventura empieza aquí"
        />
      ) : (
        <ul className="grid list-none gap-4 p-0 md:grid-cols-2">
          {viajes.map((viaje) => (
            <li key={viaje.id}>
              <TarjetaViaje viaje={viaje} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
