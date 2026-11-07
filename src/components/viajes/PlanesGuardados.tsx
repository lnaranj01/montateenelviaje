"use client";

import { useEffect, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import { formatearPesos } from "@/lib/formato";
import type { PlanGuardado } from "@/lib/datos/tipos";

interface RespuestaPlanes {
  ok: true;
  datos: { planes: PlanGuardado[] };
}

function esPlanGuardado(valor: unknown): valor is PlanGuardado {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const plan = valor as Record<string, unknown>;
  return (
    typeof plan.id === "string" &&
    typeof plan.origen === "string" &&
    typeof plan.destino === "string" &&
    typeof plan.fechaInicio === "string" &&
    typeof plan.fechaFin === "string" &&
    Number.isSafeInteger(plan.presupuesto) &&
    Number.isSafeInteger(plan.viajeros) &&
    Number.isSafeInteger(plan.total) &&
    Array.isArray(plan.servicios) &&
    plan.servicios.length > 0 &&
    plan.servicios.every(
      (servicio) =>
        typeof servicio === "object" &&
        servicio !== null &&
        "id" in servicio &&
        typeof servicio.id === "string" &&
        "categoria" in servicio &&
        typeof servicio.categoria === "string" &&
        "nombre" in servicio &&
        typeof servicio.nombre === "string" &&
        "precio" in servicio &&
        Number.isSafeInteger(servicio.precio),
    )
  );
}

function esRespuestaPlanes(valor: unknown): valor is RespuestaPlanes {
  if (typeof valor !== "object" || valor === null || !("ok" in valor)) {
    return false;
  }

  const respuesta = valor as { ok: unknown; datos?: { planes?: unknown } };
  return (
    respuesta.ok === true &&
    Array.isArray(respuesta.datos?.planes) &&
    respuesta.datos.planes.every(esPlanGuardado)
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

export function PlanesGuardados() {
  const deviceId = useDeviceId();
  const [planes, setPlanes] = useState<PlanGuardado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    const controlador = new AbortController();

    async function cargarPlanes(idDispositivo: string) {
      setCargando(true);

      try {
        const parametros = new URLSearchParams({ deviceId: idDispositivo });
        const respuesta = await fetch(
          `/api/viajes/planes?${parametros.toString()}`,
          { cache: "no-store", signal: controlador.signal },
        );
        let cuerpo: unknown;

        try {
          cuerpo = await respuesta.json();
        } catch (errorRespuesta) {
          if (errorRespuesta instanceof SyntaxError) {
            throw new Error("El servidor devolvió una respuesta inválida.");
          }
          throw errorRespuesta;
        }

        if (!respuesta.ok) {
          throw new Error(
            mensajeDeErrorApi(cuerpo) ??
              "No se pudieron cargar tus planes guardados.",
          );
        }

        if (!esRespuestaPlanes(cuerpo)) {
          throw new Error("El servidor devolvió planes guardados inválidos.");
        }

        setPlanes(cuerpo.datos.planes);
        setError("");
      } catch (errorCarga) {
        if (controlador.signal.aborted) {
          return;
        }

        setError(
          errorCarga instanceof TypeError
            ? "No se pudo conectar para cargar los planes guardados."
            : errorCarga instanceof Error
              ? errorCarga.message
              : "No se pudieron cargar tus planes guardados.",
        );
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarPlanes(deviceId);
    return () => controlador.abort();
  }, [deviceId, intento]);

  return (
    <section aria-labelledby="titulo-planes-guardados" className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primario">
          Tu colección
        </p>
        <h2
          className="mt-1 text-2xl font-extrabold tracking-tight text-texto"
          id="titulo-planes-guardados"
        >
          Planes y compras guardados
        </h2>
        <p className="mt-1 text-sm text-texto-suave">
          Consulta aquí los planes que guardaste y, cuando haya proveedores
          conectados, tus reservas confirmadas.
        </p>
      </div>

      {cargando && (
        <div
          aria-label="Cargando planes guardados"
          className="h-28 animate-pulse rounded-2xl border border-borde bg-superficie"
          role="status"
        />
      )}

      {!cargando && error && (
        <div className="grid justify-items-start gap-3">
          <Aviso tipo="error">{error}</Aviso>
          <Boton
            onClick={() => {
              setIntento((actual) => actual + 1);
            }}
            variante="secundario"
          >
            Volver a intentar
          </Boton>
        </div>
      )}

      {!cargando && !error && planes.length === 0 && (
        <Tarjeta className="border-dashed bg-superficie/70">
          <p className="font-semibold text-texto">
            Todavía no has guardado planes.
          </p>
          <p className="mt-1 text-sm text-texto-suave">
            Arma un plan en el simulador y guárdalo para encontrarlo aquí.
            Guardar un plan no significa que se haya comprado.
          </p>
        </Tarjeta>
      )}

      {!cargando && !error && planes.length > 0 && (
        <ul className="grid list-none gap-4 p-0 md:grid-cols-2">
          {planes.map((plan) => (
            <li key={plan.id}>
              <Tarjeta className="h-full rounded-2xl border-cyan-900/15 bg-gradient-to-br from-white to-slate-50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-texto">
                      {plan.origen} → {plan.destino}
                    </h3>
                    <p className="mt-1 text-sm text-texto-suave">
                      {plan.fechaInicio} – {plan.fechaFin} · {plan.viajeros}{" "}
                      {plan.viajeros === 1 ? "viajero" : "viajeros"}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-700/15 bg-cyan-700/[0.06] px-3 py-1 text-xs font-bold text-primario">
                    Plan guardado · no comprado
                  </span>
                </div>

                <ul className="mt-4 grid list-none gap-2 border-t border-borde pt-4 p-0">
                  {plan.servicios.map((servicio) => (
                    <li
                      className="flex flex-wrap justify-between gap-2 text-sm"
                      key={servicio.id}
                    >
                      <span>
                        <span className="font-semibold">
                          {servicio.categoria}:
                        </span>{" "}
                        {servicio.nombre}
                        {servicio.categoria === "Vuelos" && (
                          <span className="mt-1 block text-xs text-texto-suave">
                            {servicio.numeroEscalas === 0
                              ? "Vuelo directo de ejemplo"
                              : servicio.numeroEscalas === 1
                                ? "Vuelo con 1 escala de ejemplo"
                                : "Escalas no especificadas en este plan"}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">
                        {formatearPesos(servicio.precio)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-borde pt-4 text-sm">
                  <span className="text-texto-suave">
                    Presupuesto: {formatearPesos(plan.presupuesto)}
                  </span>
                  <strong className="text-primario">
                    Total de ejemplo: {formatearPesos(plan.total)}
                  </strong>
                </div>
                <p className="mt-3 text-xs leading-5 text-texto-suave">
                  Importes ilustrativos. No hay reserva, compra ni cobro
                  asociado a este plan.
                </p>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
