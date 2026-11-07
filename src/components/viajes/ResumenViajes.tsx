"use client";

import { useEffect, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { formatearPesos } from "@/lib/formato";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import type { ResumenViajes as DatosResumenViajes } from "@/lib/datos/tipos";
import type { EstadoViaje } from "@/lib/reglas/viaje";

interface ResumenViajesProps {
  deviceRevision: number;
  estado: EstadoViaje | "";
}

function esEnteroSeguro(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor);
}

function esResumenViajes(valor: unknown): valor is DatosResumenViajes {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const resumen = valor as Record<string, unknown>;

  return (
    esEnteroSeguro(resumen.total) &&
    esEnteroSeguro(resumen.planeados) &&
    esEnteroSeguro(resumen.completados) &&
    esEnteroSeguro(resumen.presupuestoTotal) &&
    resumen.total >= 0 &&
    resumen.planeados >= 0 &&
    resumen.completados >= 0 &&
    resumen.presupuestoTotal >= 0 &&
    resumen.planeados + resumen.completados === resumen.total
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

export function ResumenViajes({ deviceRevision, estado }: ResumenViajesProps) {
  const deviceId = useDeviceId();
  const [resumen, setResumen] = useState<DatosResumenViajes | null>(null);
  const [revisionCargada, setRevisionCargada] = useState<number | null>(null);
  const [mensajeError, setMensajeError] = useState("");
  const cargando = revisionCargada !== deviceRevision;
  const totalFiltrado =
    estado === "Planeado"
      ? resumen?.planeados
      : estado === "Completado"
        ? resumen?.completados
        : resumen?.total;

  useEffect(() => {
    const idDispositivo = deviceId;
    if (!idDispositivo) {
      return;
    }

    const controlador = new AbortController();

    async function cargarResumen(idDispositivo: string) {
      try {
        const respuesta = await fetch(
          `/api/viajes/resumen?deviceId=${encodeURIComponent(idDispositivo)}`,
          { cache: "no-store", signal: controlador.signal },
        );
        let cuerpo: unknown;

        try {
          cuerpo = await respuesta.json();
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new Error("El servidor devolvió un resumen inválido.");
          }
          throw error;
        }

        if (!respuesta.ok) {
          throw new Error(
            mensajeDeErrorApi(cuerpo) ??
              "No se pudo cargar el resumen de viajes. Inténtalo de nuevo.",
          );
        }

        if (
          typeof cuerpo !== "object" ||
          cuerpo === null ||
          !("ok" in cuerpo) ||
          cuerpo.ok !== true ||
          !("datos" in cuerpo) ||
          !esResumenViajes(cuerpo.datos)
        ) {
          throw new Error("El servidor devolvió un resumen inválido.");
        }

        setResumen(cuerpo.datos);
        setMensajeError("");
      } catch (error) {
        if (controlador.signal.aborted) {
          return;
        }

        setMensajeError(
          error instanceof TypeError
            ? "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
            : error instanceof Error
              ? error.message
              : "No se pudo cargar el resumen de viajes. Inténtalo de nuevo.",
        );
      } finally {
        if (!controlador.signal.aborted) {
          setRevisionCargada(deviceRevision);
        }
      }
    }

    void cargarResumen(idDispositivo);
    return () => controlador.abort();
  }, [deviceId, deviceRevision]);

  return (
    <section aria-labelledby="titulo-resumen" aria-live="polite">
      <Tarjeta>
        <h2 className="text-lg font-bold text-texto" id="titulo-resumen">
          Resumen de todos tus viajes
        </h2>
        {cargando && (
          <p className="mt-4 text-sm text-texto-suave" role="status">
            Cargando resumen…
          </p>
        )}
        {mensajeError && (
          <Aviso className="mt-4" tipo="error">
            {mensajeError}
          </Aviso>
        )}
        {resumen && !mensajeError && (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-sm text-texto-suave">Total de viajes</dt>
              <dd className="mt-1 text-xl font-bold text-texto">
                {resumen.total}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-texto-suave">Planeados</dt>
              <dd className="mt-1 text-xl font-bold text-texto">
                {resumen.planeados}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-texto-suave">Completados</dt>
              <dd className="mt-1 text-xl font-bold text-texto">
                {resumen.completados}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-texto-suave">Presupuesto total</dt>
              <dd className="mt-1 text-xl font-bold text-primario">
                {formatearPesos(resumen.presupuestoTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-texto-suave">
                Viajes en este filtro
              </dt>
              <dd className="mt-1 text-xl font-bold text-texto">
                {totalFiltrado} {totalFiltrado === 1 ? "viaje" : "viajes"}
              </dd>
            </div>
          </dl>
        )}
      </Tarjeta>
    </section>
  );
}
