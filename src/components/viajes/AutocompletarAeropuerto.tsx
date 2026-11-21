"use client";

import { useEffect, useState } from "react";
import { Campo } from "@/components/ui/Campo";
import { mensajeErrorDeRespuesta } from "@/components/viajes/respuestaApi";
import type { Aeropuerto, TipoRutaVuelo } from "@/lib/reglas/vuelos";
import { esquemaAeropuerto } from "@/lib/validacion/esquemas";

interface AutocompletarAeropuertoProps {
  id: string;
  etiqueta: string;
  valor: string;
  tipoRuta: TipoRutaVuelo;
  error?: string | undefined;
  placeholder: string;
  aeropuertoSeleccionado: Aeropuerto | null;
  alCambiar: (valor: string, aeropuerto: Aeropuerto | null) => void;
}

interface RespuestaAeropuertos {
  ok: true;
  datos: { aeropuertos: Aeropuerto[] };
}

interface EstadoBusqueda {
  consulta: string;
  tipoRuta: TipoRutaVuelo;
  aeropuertos: Aeropuerto[];
  cargando: boolean;
  error: string;
}

function esRespuestaAeropuertos(valor: unknown): valor is RespuestaAeropuertos {
  if (typeof valor !== "object" || valor === null || !("ok" in valor)) {
    return false;
  }

  const respuesta = valor as {
    ok: unknown;
    datos?: { aeropuertos?: unknown };
  };
  return (
    respuesta.ok === true &&
    Array.isArray(respuesta.datos?.aeropuertos) &&
    respuesta.datos.aeropuertos.every(
      (aeropuerto) => esquemaAeropuerto.safeParse(aeropuerto).success,
    )
  );
}

function etiquetaAeropuerto(aeropuerto: Aeropuerto): string {
  return `${aeropuerto.ciudad} — ${aeropuerto.nombre} (${aeropuerto.codigo})`;
}

const aeropuertosLocales: Aeropuerto[] = [
  { codigo: "BOG", nombre: "El Dorado International Airport", ciudad: "Bogotá", pais: "Colombia", codigoPais: "CO" },
  { codigo: "CTG", nombre: "Rafael Núñez International Airport", ciudad: "Cartagena", pais: "Colombia", codigoPais: "CO" },
  { codigo: "MDE", nombre: "José María Córdova International Airport", ciudad: "Medellín", pais: "Colombia", codigoPais: "CO" },
  { codigo: "CLO", nombre: "Alfonso Bonilla Aragón International Airport", ciudad: "Cali", pais: "Colombia", codigoPais: "CO" },
  { codigo: "BAQ", nombre: "Ernesto Cortissoz International Airport", ciudad: "Barranquilla", pais: "Colombia", codigoPais: "CO" },
  { codigo: "SMR", nombre: "Simón Bolívar International Airport", ciudad: "Santa Marta", pais: "Colombia", codigoPais: "CO" },
  { codigo: "ADZ", nombre: "Gustavo Rojas Pinilla International Airport", ciudad: "San Andrés", pais: "Colombia", codigoPais: "CO" },
  { codigo: "PEI", nombre: "Matecaña International Airport", ciudad: "Pereira", pais: "Colombia", codigoPais: "CO" },
  { codigo: "MAD", nombre: "Adolfo Suárez Madrid–Barajas Airport", ciudad: "Madrid", pais: "España", codigoPais: "ES" },
  { codigo: "MIA", nombre: "Miami International Airport", ciudad: "Miami", pais: "Estados Unidos", codigoPais: "US" },
  { codigo: "JFK", nombre: "John F. Kennedy International Airport", ciudad: "Nueva York", pais: "Estados Unidos", codigoPais: "US" },
  { codigo: "MEX", nombre: "Benito Juárez International Airport", ciudad: "Ciudad de México", pais: "México", codigoPais: "MX" },
  { codigo: "LIM", nombre: "Jorge Chávez International Airport", ciudad: "Lima", pais: "Perú", codigoPais: "PE" },
];

function buscarAeropuertosLocales(
  consulta: string,
  tipoRuta: TipoRutaVuelo,
): Aeropuerto[] {
  const normalizada = consulta.trim().toLocaleLowerCase("es");
  return aeropuertosLocales.filter((aeropuerto) => {
    if (tipoRuta === "nacional" && aeropuerto.codigoPais !== "CO") {
      return false;
    }
    if (tipoRuta === "internacional" && aeropuerto.codigoPais === "CO") {
      return false;
    }
    return (
      aeropuerto.ciudad.toLocaleLowerCase("es").includes(normalizada) ||
      aeropuerto.nombre.toLocaleLowerCase("es").includes(normalizada) ||
      aeropuerto.codigo.toLocaleLowerCase("es").includes(normalizada)
    );
  });
}

export function AutocompletarAeropuerto({
  aeropuertoSeleccionado,
  alCambiar,
  error,
  etiqueta,
  id,
  placeholder,
  tipoRuta,
  valor,
}: AutocompletarAeropuertoProps) {
  const [estadoBusqueda, setEstadoBusqueda] = useState<EstadoBusqueda>({
    consulta: "",
    tipoRuta,
    aeropuertos: [],
    cargando: false,
    error: "",
  });

  useEffect(() => {
    const consulta = valor.trim();
    const seleccionConfirmada =
      aeropuertoSeleccionado !== null &&
      valor === etiquetaAeropuerto(aeropuertoSeleccionado);

    if (consulta.length < 2 || seleccionConfirmada) {
      return;
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(() => {
      async function consultarAeropuertos() {
        setEstadoBusqueda({
          consulta,
          tipoRuta,
          aeropuertos: [],
          cargando: true,
          error: "",
        });
        const parametros = new URLSearchParams({
          consulta,
          tipoRuta,
        });

        try {
          const respuesta = await fetch(
            `/api/viajes/aeropuertos?${parametros.toString()}`,
            { cache: "no-store", signal: controlador.signal },
          );
          let cuerpo: unknown;

          if (!respuesta.ok) {
            throw new Error(
              await mensajeErrorDeRespuesta(
                respuesta,
                "No se pudieron consultar los aeropuertos.",
              ),
            );
          }

          try {
            cuerpo = await respuesta.json();
          } catch (errorRespuesta) {
            if (errorRespuesta instanceof SyntaxError) {
              throw new Error("El servidor devolvió una respuesta inválida.");
            }
            throw errorRespuesta;
          }

          if (!esRespuestaAeropuertos(cuerpo)) {
            throw new Error("El servidor devolvió aeropuertos inválidos.");
          }

          if (controlador.signal.aborted) {
            return;
          }

          setEstadoBusqueda({
            consulta,
            tipoRuta,
            aeropuertos: cuerpo.datos.aeropuertos,
            cargando: false,
            error: "",
          });
        } catch (errorConsulta) {
          if (controlador.signal.aborted) {
            return;
          }

          const mensaje =
            errorConsulta instanceof Error ? errorConsulta.message : "";
          if (
            errorConsulta instanceof TypeError ||
            mensaje.includes("AMADEUS_NO_CONFIGURADO") ||
            mensaje.includes("Faltan AMADEUS")
          ) {
            setEstadoBusqueda({
              consulta,
              tipoRuta,
              aeropuertos: buscarAeropuertosLocales(consulta, tipoRuta),
              cargando: false,
              error: "",
            });
            return;
          }

          setEstadoBusqueda({
            consulta,
            tipoRuta,
            aeropuertos: [],
            cargando: false,
            error:
              errorConsulta instanceof TypeError
                ? "No se pudo conectar para consultar aeropuertos."
                : errorConsulta instanceof Error
                  ? errorConsulta.message
                  : "No se pudieron consultar los aeropuertos.",
          });
        }
      }

      void consultarAeropuertos();
    }, 300);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [aeropuertoSeleccionado, tipoRuta, valor]);

  const estadoCorresponde =
    estadoBusqueda.consulta === valor.trim() &&
    estadoBusqueda.tipoRuta === tipoRuta &&
    aeropuertoSeleccionado === null;
  const aeropuertos = estadoCorresponde ? estadoBusqueda.aeropuertos : [];
  const cargando = estadoCorresponde && estadoBusqueda.cargando;
  const errorBusqueda = estadoCorresponde ? estadoBusqueda.error : "";

  return (
    <div className="grid gap-2">
      <Campo
        id={id}
        etiqueta={etiqueta}
        error={error}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={aeropuertos.length > 0 ? `${id}-opciones` : undefined}
        aria-expanded={aeropuertos.length > 0}
        onChange={(evento) => alCambiar(evento.target.value, null)}
        maxLength={80}
        placeholder={placeholder}
        required
        role="combobox"
        value={valor}
      />
      {cargando && (
        <p className="text-sm text-texto-suave" role="status">
          Buscando aeropuertos…
        </p>
      )}
      {errorBusqueda && (
        <p className="text-sm text-peligro" role="alert">
          {errorBusqueda}
        </p>
      )}
      {!cargando &&
        !errorBusqueda &&
        valor.trim().length >= 2 &&
        aeropuertos.length === 0 &&
        aeropuertoSeleccionado === null && (
          <p className="text-sm text-texto-suave" role="status">
            No encontramos aeropuertos para esa búsqueda.
          </p>
        )}
      {aeropuertos.length > 0 && (
        <ul
          className="grid list-none gap-1 rounded-xl border border-cyan-100/15 bg-[#0d2031] p-2 shadow-xl"
          id={`${id}-opciones`}
          role="listbox"
        >
          {aeropuertos.map((aeropuerto) => (
            <li key={aeropuerto.codigo} role="presentation">
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-texto transition hover:bg-cyan-300/10 focus-visible:outline-2 focus-visible:outline-acento"
                onClick={() =>
                  alCambiar(etiquetaAeropuerto(aeropuerto), aeropuerto)
                }
                role="option"
                aria-selected={false}
                type="button"
              >
                <span className="block font-semibold">
                  {aeropuerto.ciudad} · {aeropuerto.codigo}
                </span>
                <span className="block text-texto-suave">
                  {aeropuerto.nombre} · {aeropuerto.pais}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
