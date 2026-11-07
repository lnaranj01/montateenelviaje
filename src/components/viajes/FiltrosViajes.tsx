"use client";

import { usePathname, useRouter } from "next/navigation";
import type { EstadoViaje } from "@/lib/reglas/viaje";

interface FiltrosViajesProps {
  estado: EstadoViaje | "";
  orden: "inicio" | "reciente";
}

export function FiltrosViajes({ estado, orden }: FiltrosViajesProps) {
  const pathname = usePathname();
  const router = useRouter();

  function actualizarParametro(parametro: "estado" | "orden", valor: string) {
    const parametros = new URLSearchParams(window.location.search);

    if (valor) {
      parametros.set(parametro, valor);
    } else {
      parametros.delete(parametro);
    }

    const consulta = parametros.toString();
    router.push(`${pathname}${consulta ? `?${consulta}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <div className="grid gap-4 rounded-lg border border-borde bg-superficie p-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <label
          className="text-sm font-semibold text-texto"
          htmlFor="filtro-estado"
        >
          Filtrar por estado
        </label>
        <select
          className="min-h-11 rounded-lg border border-borde bg-superficie px-3 py-2 text-base text-texto outline-none focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/20"
          id="filtro-estado"
          onChange={(evento) =>
            actualizarParametro("estado", evento.target.value)
          }
          value={estado}
        >
          <option value="">Todos</option>
          <option value="Planeado">Planeado</option>
          <option value="Completado">Completado</option>
        </select>
      </div>
      <div className="grid gap-2">
        <label
          className="text-sm font-semibold text-texto"
          htmlFor="orden-viajes"
        >
          Ordenar por
        </label>
        <select
          className="min-h-11 rounded-lg border border-borde bg-superficie px-3 py-2 text-base text-texto outline-none focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/20"
          id="orden-viajes"
          onChange={(evento) =>
            actualizarParametro("orden", evento.target.value)
          }
          value={orden}
        >
          <option value="reciente">Más reciente</option>
          <option value="inicio">Fecha de inicio</option>
        </select>
      </div>
    </div>
  );
}
