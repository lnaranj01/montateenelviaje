"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { formatearPesos } from "@/lib/formato";
import { duracionDias, finNoAnteriorAInicio } from "@/lib/reglas/fechas";

type PasoDemo = "busqueda" | "opciones" | "revision" | "finalizada";
type UnidadOferta = "viajero" | "noche" | "dia";

const MAXIMO_PRESUPUESTO_COP = 1_000_000_000_000;

interface OfertaDemo {
  id: string;
  categoria: string;
  nombre: string;
  descripcion: string;
  proporcionPresupuestoDiario: number;
  unidad: UnidadOferta;
}

const ofertasDemo: OfertaDemo[] = [
  {
    id: "vuelo-economico",
    categoria: "Vuelos",
    nombre: "Vuelo nacional de muestra",
    descripcion: "Ejemplo de vuelo ida y vuelta por viajero.",
    proporcionPresupuestoDiario: 0.9,
    unidad: "viajero",
  },
  {
    id: "vuelo-flexible",
    categoria: "Vuelos",
    nombre: "Vuelo flexible de muestra",
    descripcion: "Ejemplo de tarifa flexible por viajero.",
    proporcionPresupuestoDiario: 1.56,
    unidad: "viajero",
  },
  {
    id: "hospedaje-sencillo",
    categoria: "Hospedaje",
    nombre: "Hospedaje de muestra",
    descripcion: "Alojamiento ficticio; tarifa por noche.",
    proporcionPresupuestoDiario: 0.3,
    unidad: "noche",
  },
  {
    id: "hospedaje-central",
    categoria: "Hospedaje",
    nombre: "Hospedaje central de muestra",
    descripcion: "Opción ficticia; tarifa por noche.",
    proporcionPresupuestoDiario: 0.48,
    unidad: "noche",
  },
  {
    id: "carro-compacto",
    categoria: "Carros",
    nombre: "Carro compacto de muestra",
    descripcion: "Alquiler ficticio; tarifa por día.",
    proporcionPresupuestoDiario: 0.18,
    unidad: "dia",
  },
  {
    id: "carro-familiar",
    categoria: "Carros",
    nombre: "Carro familiar de muestra",
    descripcion: "Alquiler ficticio; tarifa por día.",
    proporcionPresupuestoDiario: 0.315,
    unidad: "dia",
  },
  {
    id: "tour-cultural",
    categoria: "Tours y actividades",
    nombre: "Tour cultural de muestra",
    descripcion: "Actividad ficticia; tarifa por viajero.",
    proporcionPresupuestoDiario: 0.195,
    unidad: "viajero",
  },
  {
    id: "tour-aventura",
    categoria: "Tours y actividades",
    nombre: "Tour de aventura de muestra",
    descripcion: "Actividad ficticia; tarifa por viajero.",
    proporcionPresupuestoDiario: 0.39,
    unidad: "viajero",
  },
  {
    id: "kit-esencial",
    categoria: "Artículos esenciales",
    nombre: "Kit de viaje de muestra",
    descripcion: "Artículos ficticios; ejemplo por viajero.",
    proporcionPresupuestoDiario: 0.135,
    unidad: "viajero",
  },
  {
    id: "kit-completo",
    categoria: "Artículos esenciales",
    nombre: "Kit completo de muestra",
    descripcion: "Artículos ficticios; ejemplo por viajero.",
    proporcionPresupuestoDiario: 0.33,
    unidad: "viajero",
  },
];

const categorias = [
  "Vuelos",
  "Hospedaje",
  "Carros",
  "Tours y actividades",
  "Artículos esenciales",
];

function unidadesPara(
  oferta: OfertaDemo,
  noches: number,
  dias: number,
  viajeros: number,
): number {
  if (oferta.unidad === "noche") {
    return noches;
  }

  if (oferta.unidad === "dia") {
    return dias;
  }

  return viajeros;
}

function precioOferta(
  oferta: OfertaDemo,
  presupuesto: number,
  noches: number,
  dias: number,
  viajeros: number,
): number {
  const presupuestoDiarioPorViajero = presupuesto / dias / viajeros;
  const precioPorViajeroDia =
    presupuestoDiarioPorViajero * oferta.proporcionPresupuestoDiario;
  const precioPorUnidad = Math.max(
    1_000,
    Math.round(precioPorViajeroDia / 1_000) * 1_000,
  );
  const cantidadUnidades = unidadesPara(oferta, noches, dias, viajeros);
  const cantidadViajeros = oferta.unidad === "viajero" ? 1 : viajeros;

  return precioPorUnidad * cantidadUnidades * cantidadViajeros;
}

export function PlanificadorViajeDemo() {
  const [paso, setPaso] = useState<PasoDemo>("busqueda");
  const [destino, setDestino] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [viajeros, setViajeros] = useState("2");
  const [presupuesto, setPresupuesto] = useState("");
  const [selecciones, setSelecciones] = useState<Record<string, string>>({});
  const [errorFechas, setErrorFechas] = useState("");
  const [errorPresupuesto, setErrorPresupuesto] = useState("");

  const dias =
    fechaInicio && fechaFin && finNoAnteriorAInicio(fechaInicio, fechaFin)
      ? duracionDias(fechaInicio, fechaFin)
      : 0;
  const noches = Math.max(dias - 1, 0);
  const presupuestoNumero = Number(presupuesto);
  const ofertasElegidas = ofertasDemo.filter(
    (oferta) => selecciones[oferta.categoria] === oferta.id,
  );
  const totalEjemplo = ofertasElegidas.reduce(
    (total, oferta) =>
      total +
      precioOferta(oferta, presupuestoNumero, noches, dias, Number(viajeros)),
    0,
  );
  const saldoEjemplo = presupuestoNumero - totalEjemplo;
  const superaPresupuesto = saldoEjemplo < 0;
  const porcentajeUsado =
    presupuestoNumero > 0
      ? Math.min((totalEjemplo / presupuestoNumero) * 100, 100)
      : totalEjemplo > 0
        ? 100
        : 0;

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorFechas("");
    setErrorPresupuesto("");

    if (!finNoAnteriorAInicio(fechaInicio, fechaFin)) {
      setErrorFechas(
        "La fecha de salida no puede ser anterior a la de llegada.",
      );
      return;
    }

    if (
      !Number.isSafeInteger(Number(presupuesto)) ||
      Number(presupuesto) < 1 ||
      Number(presupuesto) > MAXIMO_PRESUPUESTO_COP
    ) {
      setErrorPresupuesto(
        "Ingresa un presupuesto entero entre $1 y $1.000.000.000.000 COP.",
      );
      return;
    }

    setSelecciones({});
    setPaso("opciones");
  }

  function alternarOferta(oferta: OfertaDemo) {
    setSelecciones((actuales) => {
      if (actuales[oferta.categoria] === oferta.id) {
        const siguientes = { ...actuales };
        delete siguientes[oferta.categoria];
        return siguientes;
      }

      return { ...actuales, [oferta.categoria]: oferta.id };
    });
  }

  function reiniciar() {
    setPaso("busqueda");
    setSelecciones({});
    setErrorFechas("");
  }

  return (
    <main className="min-h-screen bg-fondo-viajes px-4 py-8 text-texto sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <Link
          className="w-fit rounded-sm text-sm font-semibold text-primario underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
          href="/viajes"
        >
          Volver a mis viajes
        </Link>

        <Aviso tipo="error">
          Demostración: todos los servicios, precios y totales son ficticios. No
          hay disponibilidad real, no se crean reservas ni se realizan compras o
          cobros.
        </Aviso>

        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primario">
            Planifica según tu presupuesto
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Arma tu viaje completo
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-texto-suave">
            Explora un ejemplo de vuelos, hospedaje, carro, tours y artículos
            esenciales, y mira cómo afecta cada elección a tu presupuesto.
          </p>
        </header>

        <Tarjeta>
          <div className="flex flex-wrap gap-2 text-sm" aria-label="Pasos">
            {[
              ["busqueda", "1. Tu presupuesto"],
              ["opciones", "2. Servicios"],
              ["revision", "3. Resumen"],
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
              <h2 className="text-xl font-bold">Cuéntanos sobre tu viaje</h2>
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
                  etiqueta="Fecha de llegada"
                  name="fechaInicio"
                  onChange={(evento) => setFechaInicio(evento.target.value)}
                  required
                  type="date"
                  value={fechaInicio}
                />
                <Campo
                  etiqueta="Fecha de salida"
                  error={errorFechas || undefined}
                  min={fechaInicio || undefined}
                  name="fechaFin"
                  onChange={(evento) => setFechaFin(evento.target.value)}
                  required
                  type="date"
                  value={fechaFin}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo
                  etiqueta="Presupuesto total (COP)"
                  error={errorPresupuesto || undefined}
                  inputMode="numeric"
                  max={MAXIMO_PRESUPUESTO_COP}
                  min={1}
                  name="presupuesto"
                  onChange={(evento) => {
                    setPresupuesto(evento.target.value);
                    setErrorPresupuesto("");
                  }}
                  placeholder="Ej. 2500000"
                  required
                  step={1}
                  type="number"
                  value={presupuesto}
                />
                <label className="grid max-w-sm gap-2 text-sm font-semibold">
                  Viajeros
                  <select
                    className="min-h-11 rounded-lg border border-borde bg-superficie px-3 py-2 text-base font-normal text-texto outline-none focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/20"
                    name="viajeros"
                    onChange={(evento) => setViajeros(evento.target.value)}
                    value={viajeros}
                  >
                    <option value="1">1 viajero</option>
                    <option value="2">2 viajeros</option>
                    <option value="3">3 viajeros</option>
                    <option value="4">4 viajeros</option>
                  </select>
                </label>
              </div>
              <Boton className="w-fit" type="submit">
                Ver servicios de ejemplo
              </Boton>
            </form>
          )}

          {paso === "opciones" && (
            <section
              className="mt-6 grid gap-6"
              aria-labelledby="titulo-servicios"
            >
              <div>
                <h2 className="text-xl font-bold" id="titulo-servicios">
                  Servicios de ejemplo para {destino}
                </h2>
                <p className="mt-1 text-sm text-texto-suave">
                  {fechaInicio} – {fechaFin} · {noches}{" "}
                  {noches === 1 ? "noche" : "noches"} · {viajeros}{" "}
                  {viajeros === "1" ? "viajero" : "viajeros"} · Presupuesto{" "}
                  {formatearPesos(presupuestoNumero)} COP
                </p>
                <p className="mt-2 text-sm text-texto-suave">
                  Los importes de muestra se ajustan al presupuesto diario por
                  viajero y a la duración del viaje.
                </p>
              </div>

              {categorias.map((categoria) => {
                if (categoria === "Hospedaje" && noches === 0) {
                  return (
                    <div className="grid gap-2" key={categoria}>
                      <h3 className="text-lg font-bold">{categoria}</h3>
                      <Aviso tipo="informacion">
                        Para esta salida de un día no se necesitan noches de
                        hospedaje.
                      </Aviso>
                    </div>
                  );
                }

                const opciones = ofertasDemo.filter(
                  (oferta) => oferta.categoria === categoria,
                );

                return (
                  <div className="grid gap-3" key={categoria}>
                    <h3 className="text-lg font-bold">{categoria}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {opciones.map((oferta) => {
                        const precio = precioOferta(
                          oferta,
                          presupuestoNumero,
                          noches,
                          dias,
                          Number(viajeros),
                        );
                        const elegida = selecciones[categoria] === oferta.id;

                        return (
                          <Tarjeta
                            className="grid content-between gap-4"
                            key={oferta.id}
                          >
                            <div>
                              <h4 className="font-bold">{oferta.nombre}</h4>
                              <p className="mt-1 text-sm text-texto-suave">
                                {oferta.descripcion}
                              </p>
                              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-peligro">
                                Precio simulado · no disponible para compra
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="font-bold">
                                {formatearPesos(precio)} COP
                              </p>
                              <span className="text-xs text-texto-suave">
                                Total de ejemplo para {viajeros}{" "}
                                {viajeros === "1" ? "viajero" : "viajeros"} y{" "}
                                {dias} {dias === 1 ? "día" : "días"}
                              </span>
                              <Boton
                                aria-label={`${elegida ? "Quitar" : "Elegir"} ${oferta.nombre}`}
                                aria-pressed={elegida}
                                onClick={() => alternarOferta(oferta)}
                                variante={elegida ? "secundario" : "primario"}
                              >
                                {elegida ? "Quitar" : "Elegir ejemplo"}
                              </Boton>
                            </div>
                          </Tarjeta>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <Tarjeta className="grid gap-2">
                <h3 className="font-bold">Tu presupuesto</h3>
                <p>
                  Seleccionado:{" "}
                  <strong>{formatearPesos(totalEjemplo)} COP</strong>
                </p>
                <div
                  aria-label="Presupuesto utilizado"
                  aria-valuemax={Math.max(presupuestoNumero, 1)}
                  aria-valuemin={0}
                  aria-valuenow={Math.min(totalEjemplo, presupuestoNumero)}
                  className="h-3 overflow-hidden rounded-full bg-fondo-viajes"
                  role="meter"
                >
                  <div
                    className={`h-full rounded-full ${superaPresupuesto ? "bg-peligro" : "bg-primario"}`}
                    style={{ width: `${porcentajeUsado}%` }}
                  />
                </div>
                {superaPresupuesto ? (
                  <Aviso tipo="error">
                    Excedes el presupuesto por{" "}
                    {formatearPesos(Math.abs(saldoEjemplo))} COP. Cambia o quita
                    servicios para ajustar el ejemplo.
                  </Aviso>
                ) : (
                  <p className="text-sm text-texto-suave">
                    Disponible en este ejemplo:{" "}
                    <strong>{formatearPesos(saldoEjemplo)} COP</strong>
                  </p>
                )}
              </Tarjeta>

              <div className="flex flex-wrap gap-3">
                <Boton onClick={reiniciar} variante="fantasma">
                  Cambiar datos del viaje
                </Boton>
                <Boton
                  disabled={ofertasElegidas.length === 0}
                  onClick={() => setPaso("revision")}
                >
                  Revisar mi plan
                </Boton>
              </div>
            </section>
          )}

          {paso === "revision" && (
            <section
              aria-labelledby="titulo-revision"
              className="mt-6 grid gap-5"
            >
              <h2 className="text-xl font-bold" id="titulo-revision">
                Resumen de tu viaje de ejemplo
              </h2>
              <p className="text-sm text-texto-suave">
                {destino} · {fechaInicio} – {fechaFin} · {viajeros}{" "}
                {viajeros === "1" ? "viajero" : "viajeros"}
              </p>
              <ul className="grid gap-3">
                {ofertasElegidas.map((oferta) => (
                  <li
                    className="flex flex-wrap justify-between gap-2 border-b border-borde pb-3"
                    key={oferta.id}
                  >
                    <span>{oferta.nombre}</span>
                    <strong>
                      {formatearPesos(
                        precioOferta(
                          oferta,
                          presupuestoNumero,
                          noches,
                          dias,
                          Number(viajeros),
                        ),
                      )}{" "}
                      COP
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="text-lg font-bold">
                Total de ejemplo: {formatearPesos(totalEjemplo)} COP
              </p>
              <p>
                {superaPresupuesto
                  ? `Excede el presupuesto por ${formatearPesos(Math.abs(saldoEjemplo))} COP.`
                  : `Quedarían ${formatearPesos(saldoEjemplo)} COP del presupuesto.`}
              </p>
              <Aviso tipo="error">
                Este resumen usa precios inventados. No es una cotización ni una
                compra, y no se enviaron datos a proveedores.
              </Aviso>
              <div className="flex flex-wrap gap-3">
                <Boton
                  onClick={() => setPaso("opciones")}
                  variante="secundario"
                >
                  Volver a servicios
                </Boton>
                <Boton onClick={() => setPaso("finalizada")}>
                  Terminar simulación
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
                Pudiste armar un presupuesto de ejemplo. No se compraron
                servicios, no se crearon reservas y no se realizó ningún cobro.
              </Aviso>
              <Boton className="w-fit" onClick={reiniciar}>
                Planear otro viaje
              </Boton>
            </section>
          )}
        </Tarjeta>
      </div>
    </main>
  );
}
