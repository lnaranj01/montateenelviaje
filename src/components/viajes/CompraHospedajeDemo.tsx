"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { formatearPesos } from "@/lib/formato";
import { duracionDias, finNoAnteriorAInicio } from "@/lib/reglas/fechas";

type PasoDemo = "busqueda" | "resultados" | "revision" | "finalizada";

interface AlojamientoDemo {
  id: string;
  nombre: string;
  descripcion: string;
  precioNoche: number;
}

const alojamientosDemo: AlojamientoDemo[] = [
  {
    id: "alojamiento-demo-1",
    nombre: "Hospedaje de muestra · opción tranquila",
    descripcion: "Alojamiento ficticio para recorrer el prototipo.",
    precioNoche: 320_000,
  },
  {
    id: "alojamiento-demo-2",
    nombre: "Hospedaje de muestra · opción central",
    descripcion: "Opción ficticia; no corresponde a un establecimiento real.",
    precioNoche: 245_000,
  },
];

export function CompraHospedajeDemo() {
  const [paso, setPaso] = useState<PasoDemo>("busqueda");
  const [destino, setDestino] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [huespedes, setHuespedes] = useState("2");
  const [alojamiento, setAlojamiento] = useState<AlojamientoDemo | null>(null);
  const [errorFechas, setErrorFechas] = useState("");

  const noches =
    fechaInicio && fechaFin && finNoAnteriorAInicio(fechaInicio, fechaFin)
      ? duracionDias(fechaInicio, fechaFin) - 1
      : 0;
  const totalEjemplo = alojamiento ? alojamiento.precioNoche * noches : 0;

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorFechas("");

    if (!finNoAnteriorAInicio(fechaInicio, fechaFin)) {
      setErrorFechas(
        "La fecha de salida no puede ser anterior a la de llegada.",
      );
      return;
    }

    setAlojamiento(null);
    setPaso("resultados");
  }

  function seleccionarAlojamiento(opcion: AlojamientoDemo) {
    setAlojamiento(opcion);
    setPaso("revision");
  }

  function reiniciar() {
    setPaso("busqueda");
    setAlojamiento(null);
    setErrorFechas("");
  }

  return (
    <main className="min-h-screen bg-fondo-viajes px-4 py-8 text-texto sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link
          className="w-fit rounded-sm text-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
          href="/viajes"
        >
          Volver a mis viajes
        </Link>

        <Aviso tipo="error">
          Prototipo de demostración: los alojamientos y precios son ficticios.
          No hay disponibilidad real, no se crea una reserva ni se procesa un
          pago.
        </Aviso>

        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primario">
            Próximamente
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Prueba una reserva de hospedaje
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-texto-suave">
            Recorre una muestra del flujo planeado: buscar, comparar y revisar
            el total antes de continuar.
          </p>
        </header>

        <Tarjeta>
          <div className="flex flex-wrap gap-2 text-sm" aria-label="Pasos">
            {[
              ["busqueda", "1. Búsqueda"],
              ["resultados", "2. Opciones"],
              ["revision", "3. Revisión"],
              ["finalizada", "4. Resultado"],
            ].map(([id, titulo]) => (
              <span
                aria-current={paso === id ? "step" : undefined}
                className={`rounded-full px-3 py-1 ${paso === id ? "bg-primario text-white" : "bg-fondo-viajes text-texto-suave"}`}
                key={id}
              >
                {titulo}
              </span>
            ))}
          </div>

          {paso === "busqueda" && (
            <form className="mt-6 grid gap-5" onSubmit={buscar}>
              <h2 className="text-xl font-bold">¿A dónde vas?</h2>
              <Campo
                autoComplete="address-level2"
                etiqueta="Destino"
                name="destino"
                onChange={(evento) => setDestino(evento.target.value)}
                placeholder="Ej. Cartagena"
                required
                value={destino}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo
                  etiqueta="Llegada"
                  name="fechaInicio"
                  onChange={(evento) => setFechaInicio(evento.target.value)}
                  required
                  type="date"
                  value={fechaInicio}
                />
                <Campo
                  etiqueta="Salida"
                  error={errorFechas || undefined}
                  min={fechaInicio || undefined}
                  name="fechaFin"
                  onChange={(evento) => setFechaFin(evento.target.value)}
                  required
                  type="date"
                  value={fechaFin}
                />
              </div>
              <label className="grid max-w-sm gap-2 text-sm font-semibold">
                Huéspedes
                <select
                  className="min-h-11 rounded-lg border border-borde bg-superficie px-3 py-2 text-base font-normal text-texto outline-none focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/20"
                  name="huespedes"
                  onChange={(evento) => setHuespedes(evento.target.value)}
                  value={huespedes}
                >
                  <option value="1">1 huésped</option>
                  <option value="2">2 huéspedes</option>
                  <option value="3">3 huéspedes</option>
                  <option value="4">4 huéspedes</option>
                </select>
              </label>
              <Boton className="w-fit" type="submit">
                Buscar opciones de muestra
              </Boton>
            </form>
          )}

          {paso === "resultados" && (
            <section
              aria-labelledby="titulo-opciones"
              className="mt-6 grid gap-5"
            >
              <div>
                <h2 className="text-xl font-bold" id="titulo-opciones">
                  Opciones ficticias en {destino}
                </h2>
                <p className="mt-1 text-sm text-texto-suave">
                  {fechaInicio} – {fechaFin} · {noches}{" "}
                  {noches === 1 ? "noche" : "noches"} · {huespedes}{" "}
                  {huespedes === "1" ? "huésped" : "huéspedes"}
                </p>
              </div>
              {alojamientosDemo.map((opcion) => (
                <Tarjeta
                  className="grid gap-4 sm:grid-cols-[1fr_auto]"
                  key={opcion.id}
                >
                  <div>
                    <h3 className="text-lg font-bold">{opcion.nombre}</h3>
                    <p className="mt-1 text-sm text-texto-suave">
                      {opcion.descripcion}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-peligro">
                      Tarifa simulada · no disponible para compra
                    </p>
                  </div>
                  <div className="grid content-start gap-3 sm:justify-items-end">
                    <p className="font-bold">
                      {formatearPesos(opcion.precioNoche)} / noche
                    </p>
                    <Boton
                      onClick={() => seleccionarAlojamiento(opcion)}
                      variante="secundario"
                    >
                      Revisar ejemplo
                    </Boton>
                  </div>
                </Tarjeta>
              ))}
              <Boton className="w-fit" onClick={reiniciar} variante="fantasma">
                Cambiar búsqueda
              </Boton>
            </section>
          )}

          {paso === "revision" && alojamiento && (
            <section
              aria-labelledby="titulo-revision"
              className="mt-6 grid gap-5"
            >
              <h2 className="text-xl font-bold" id="titulo-revision">
                Revisa el ejemplo
              </h2>
              <div className="grid gap-2 text-sm text-texto-suave">
                <p className="font-semibold text-texto">{alojamiento.nombre}</p>
                <p>
                  {destino} · {fechaInicio} – {fechaFin} · {noches}{" "}
                  {noches === 1 ? "noche" : "noches"} · {huespedes}{" "}
                  {huespedes === "1" ? "huésped" : "huéspedes"}
                </p>
                <p>
                  {formatearPesos(alojamiento.precioNoche)} × {noches} noches
                </p>
                <p className="text-lg font-bold text-texto">
                  Total de ejemplo: {formatearPesos(totalEjemplo)} COP
                </p>
              </div>
              <Aviso tipo="error">
                Este total es inventado para probar la pantalla. No es una
                cotización, no incluye condiciones reales y no se cobrará.
              </Aviso>
              <div className="flex flex-wrap gap-3">
                <Boton
                  onClick={() => setPaso("resultados")}
                  variante="secundario"
                >
                  Volver a opciones
                </Boton>
                <Boton onClick={() => setPaso("finalizada")}>
                  Probar confirmación (sin reservar)
                </Boton>
              </div>
            </section>
          )}

          {paso === "finalizada" && (
            <section
              aria-labelledby="titulo-finalizada"
              className="mt-6 grid gap-5"
            >
              <h2 className="text-xl font-bold" id="titulo-finalizada">
                Fin de la demostración
              </h2>
              <Aviso tipo="exito">
                Pudiste recorrer el prototipo. No se creó ninguna reserva, no se
                enviaron datos a un proveedor y no se realizó ningún cobro.
              </Aviso>
              <Boton className="w-fit" onClick={reiniciar}>
                Probar de nuevo
              </Boton>
            </section>
          )}
        </Tarjeta>
      </div>
    </main>
  );
}
