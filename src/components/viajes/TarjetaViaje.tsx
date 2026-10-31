"use client";

import { useCallback, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { InsigniaEstado } from "@/components/viajes/InsigniaEstado";
import { Modal } from "@/components/ui/Modal";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { mensajeErrorDeRespuesta } from "@/components/viajes/respuestaApi";
import {
  formatearDuracion,
  formatearFecha,
  formatearPesos,
} from "@/lib/formato";
import type { Viaje } from "@/lib/datos/tipos";

export type AccionViaje = "completar" | "reactivar" | "eliminar";

interface TarjetaViajeProps {
  viaje: Viaje;
  deviceId: string;
  alEditar: (viaje: Viaje) => void;
  alCambiar: (accion: AccionViaje, viaje: Viaje) => void;
}

export function TarjetaViaje({
  alCambiar,
  alEditar,
  deviceId,
  viaje,
}: TarjetaViajeProps) {
  const [accionEnCurso, setAccionEnCurso] = useState<AccionViaje | null>(null);
  const [mensajeError, setMensajeError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const estaCompletado = viaje.completado;

  const cerrarModal = useCallback(() => setModalAbierto(false), []);

  async function ejecutarAccion(
    accion: "completar" | "reactivar" | "eliminar",
  ) {
    setAccionEnCurso(accion);
    setMensajeError("");

    const esEliminacion = accion === "eliminar";
    const metodo = esEliminacion ? "DELETE" : "PATCH";
    const ruta = esEliminacion
      ? `/api/viajes/${encodeURIComponent(viaje.id)}`
      : `/api/viajes/${encodeURIComponent(viaje.id)}/completar`;

    try {
      const respuesta = await fetch(ruta, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      if (!respuesta.ok) {
        throw new Error(
          await mensajeErrorDeRespuesta(
            respuesta,
            esEliminacion
              ? "No se pudo eliminar el viaje. Inténtalo de nuevo."
              : "No se pudo actualizar el estado del viaje. Inténtalo de nuevo.",
          ),
        );
      }

      if (esEliminacion) {
        setModalAbierto(false);
      }
      alCambiar(accion, viaje);
    } catch (error) {
      setMensajeError(
        error instanceof TypeError
          ? "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
          : error instanceof Error
            ? error.message
            : "No se pudo completar la acción. Inténtalo de nuevo.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  }

  function iniciarEdicion() {
    alEditar(viaje);
    document
      .getElementById("formulario-viaje")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <Tarjeta
      className={`flex h-full flex-col ${estaCompletado ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold leading-snug text-texto">
            {viaje.destino}
          </h3>
          <p className="mt-1 text-sm text-texto-suave">
            {formatearDuracion(viaje.duracionDias)}
          </p>
        </div>
        <InsigniaEstado estado={viaje.estado} />
      </div>

      <dl className="mt-5 grid flex-1 gap-4 border-t border-borde pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Fechas
          </dt>
          <dd className="mt-1 text-sm font-medium text-texto">
            {formatearFecha(viaje.fechaInicio)} –{" "}
            {formatearFecha(viaje.fechaFin)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Presupuesto
          </dt>
          <dd className="mt-1 text-base font-bold text-primario">
            {formatearPesos(viaje.presupuesto)}
          </dd>
        </div>
      </dl>

      {mensajeError && !modalAbierto && (
        <Aviso className="mt-4" tipo="error">
          {mensajeError}
        </Aviso>
      )}

      <div
        aria-label={`Acciones para ${viaje.destino}`}
        className="mt-5 grid grid-cols-3 gap-2 border-t border-borde pt-4"
        role="group"
      >
        <Boton
          aria-label={`${estaCompletado ? "Reactivar" : "Completar"} ${viaje.destino}`}
          cargando={
            accionEnCurso === (estaCompletado ? "reactivar" : "completar")
          }
          className="px-2 text-xs"
          disabled={accionEnCurso !== null}
          onClick={() =>
            void ejecutarAccion(estaCompletado ? "reactivar" : "completar")
          }
          variante="secundario"
        >
          {estaCompletado ? "Reactivar" : "Completar"}
        </Boton>
        <Boton
          aria-label={`Editar ${viaje.destino}`}
          className="px-2 text-xs"
          disabled={accionEnCurso !== null}
          onClick={iniciarEdicion}
          variante="secundario"
        >
          Editar
        </Boton>
        <Boton
          aria-label={`Eliminar ${viaje.destino}`}
          className="px-2 text-xs"
          disabled={accionEnCurso !== null}
          onClick={() => {
            setMensajeError("");
            setModalAbierto(true);
          }}
          variante="peligro"
        >
          Eliminar
        </Boton>
      </div>

      <Modal
        abierto={modalAbierto}
        alCerrar={cerrarModal}
        titulo="Confirmar eliminación"
      >
        <div className="grid gap-5">
          <p className="text-sm leading-6 text-texto-suave">
            ¿Eliminar el viaje a {viaje.destino}? Esta acción no se puede
            deshacer.
          </p>
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Boton
              disabled={accionEnCurso !== null}
              onClick={cerrarModal}
              variante="secundario"
            >
              Cancelar
            </Boton>
            <Boton
              cargando={accionEnCurso === "eliminar"}
              disabled={accionEnCurso !== null}
              onClick={() => void ejecutarAccion("eliminar")}
              variante="peligro"
            >
              Eliminar
            </Boton>
          </div>
          {mensajeError && <Aviso tipo="error">{mensajeError}</Aviso>}
        </div>
      </Modal>
    </Tarjeta>
  );
}
