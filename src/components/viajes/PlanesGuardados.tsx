"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Modal } from "@/components/ui/Modal";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { mensajeErrorDeRespuesta } from "@/components/viajes/respuestaApi";
import { CLAVE_DATOS_INICIALES_PLANIFICADOR } from "@/lib/config/planificador";
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
  const router = useRouter();
  const [planes, setPlanes] = useState<PlanGuardado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [planAEliminar, setPlanAEliminar] = useState<PlanGuardado | null>(null);
  const [planEliminando, setPlanEliminando] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState("");

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

  function volverAEntrar(plan: PlanGuardado) {
    setErrorAccion("");
    setMensajeAccion("");

    try {
      sessionStorage.setItem(
        CLAVE_DATOS_INICIALES_PLANIFICADOR,
        JSON.stringify({
          origen: plan.origen,
          destino: plan.destino,
          fechaInicio: plan.fechaInicio,
          fechaFin: plan.fechaFin,
          presupuesto: plan.presupuesto,
          viajeros: plan.viajeros,
          servicios: plan.servicios.map((servicio) => servicio.id),
        }),
      );
    } catch {
      setErrorAccion(
        "No se pudo preparar el plan en este navegador. Revisa el almacenamiento e inténtalo de nuevo.",
      );
      return;
    }

    router.push("/demo-compras");
  }

  async function confirmarEliminacion() {
    if (!deviceId || !planAEliminar) {
      setErrorAccion(
        "No se pudo identificar el dispositivo para eliminar el plan. Recarga la página e inténtalo de nuevo.",
      );
      return;
    }

    const plan = planAEliminar;
    setPlanEliminando(plan.id);
    setErrorAccion("");
    setMensajeAccion("");

    try {
      const respuesta = await fetch(
        `/api/viajes/planes/${encodeURIComponent(plan.id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        },
      );

      if (!respuesta.ok) {
        throw new Error(
          await mensajeErrorDeRespuesta(
            respuesta,
            "No se pudo eliminar el plan guardado. Inténtalo de nuevo.",
          ),
        );
      }

      setPlanes((actuales) =>
        actuales.filter((actual) => actual.id !== plan.id),
      );
      setPlanAEliminar(null);
      setMensajeAccion(`Se eliminó el plan para ${plan.destino}.`);
    } catch (errorEliminacion) {
      setErrorAccion(
        errorEliminacion instanceof TypeError
          ? "No se pudo conectar para eliminar el plan. Revisa tu conexión e inténtalo de nuevo."
          : errorEliminacion instanceof Error
            ? errorEliminacion.message
            : "No se pudo eliminar el plan guardado. Inténtalo de nuevo.",
      );
    } finally {
      setPlanEliminando(null);
    }
  }

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

      {errorAccion && <Aviso tipo="error">{errorAccion}</Aviso>}
      {mensajeAccion && <Aviso tipo="exito">{mensajeAccion}</Aviso>}

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
                <div
                  aria-label={`Acciones para el plan de ${plan.destino}`}
                  className="mt-4 flex flex-wrap gap-2 border-t border-borde pt-4"
                  role="group"
                >
                  <Boton
                    onClick={() => volverAEntrar(plan)}
                    variante="secundario"
                  >
                    Volver a entrar
                  </Boton>
                  <Boton
                    aria-label={`Eliminar plan de ${plan.destino}`}
                    onClick={() => {
                      setErrorAccion("");
                      setPlanAEliminar(plan);
                    }}
                    variante="peligro"
                  >
                    Eliminar plan
                  </Boton>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}

      <Modal
        abierto={planAEliminar !== null}
        alCerrar={() => {
          if (!planEliminando) {
            setPlanAEliminar(null);
          }
        }}
        titulo="Eliminar plan guardado"
      >
        <p>
          ¿Quieres eliminar el plan para{" "}
          <strong>{planAEliminar?.destino}</strong>? Esta acción no se puede
          deshacer.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Boton
            disabled={planEliminando !== null}
            onClick={() => setPlanAEliminar(null)}
            variante="secundario"
          >
            Conservar plan
          </Boton>
          <Boton
            cargando={planEliminando !== null}
            onClick={() => void confirmarEliminacion()}
            variante="peligro"
          >
            Confirmar eliminación
          </Boton>
        </div>
      </Modal>
    </section>
  );
}
