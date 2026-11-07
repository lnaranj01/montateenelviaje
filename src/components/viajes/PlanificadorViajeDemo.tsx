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
    <div className="[--fondo-viajes:#06111f] [--superficie:#0b1c2d] [--texto:#e8f7ff] [--texto-suave:#9bb6c9] [--borde:#1a3a52] [--primario:#08749b] [--primario-suave:#102d40] [--acento:#52ddff]">
      <main className="relative isolate min-h-screen overflow-hidden bg-fondo-viajes px-4 py-8 text-texto sm:px-6 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_0%,rgba(0,190,255,0.2),transparent_38%),radial-gradient(ellipse_at_90%_35%,rgba(0,110,255,0.13),transparent_36%)]"
        />
        <div className="relative mx-auto grid w-full max-w-5xl gap-7">
          <Link
            className="w-fit rounded-sm text-sm font-semibold text-acento underline decoration-acento/40 underline-offset-4 transition hover:decoration-acento focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
            href="/viajes"
          >
            Volver a mis viajes
          </Link>

          <Aviso
            className="!text-cyan-100 border-cyan-400/25 bg-cyan-400/[0.08] shadow-[0_0_28px_rgba(34,211,238,0.06)]"
            tipo="informacion"
          >
            <span className="font-bold text-acento">SIMULACIÓN ·</span> Todos
            los servicios, precios y totales son ficticios. No hay
            disponibilidad real, reservas ni cobros.
          </Aviso>

          <header className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-[#0d263b] via-[#0a1c2e] to-[#0b1726] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)] sm:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-20 size-72 rounded-full bg-cyan-400/10 blur-3xl"
            />
            <p className="relative inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-acento">
              <span className="size-1.5 rounded-full bg-acento shadow-[0_0_12px_#52ddff]" />
              Planifica según tu presupuesto
            </p>
            <h1 className="relative mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
              Arma un viaje que{" "}
              <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                se ajuste a ti.
              </span>
            </h1>
            <p className="relative mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Explora un ejemplo de vuelos, hospedaje, carro, tours y artículos
              esenciales, y mira cómo afecta cada elección a tu presupuesto.
            </p>
          </header>

          <Tarjeta className="border-cyan-300/15 bg-[#091827]/90 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8">
            <div
              className="flex flex-wrap gap-2 border-b border-white/[0.07] pb-6 text-sm"
              aria-label="Pasos"
            >
              {[
                ["busqueda", "01", "Tu presupuesto"],
                ["opciones", "02", "Servicios"],
                ["revision", "03", "Resumen"],
                ["finalizada", "04", "Listo"],
              ].map(([id, numero, titulo]) => (
                <span
                  aria-current={paso === id ? "step" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm ${paso === id ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.08)]" : "border-white/[0.07] bg-white/[0.025] text-slate-400"}`}
                  key={id}
                >
                  <span
                    className={paso === id ? "text-acento" : "text-slate-500"}
                  >
                    {numero}
                  </span>
                  {titulo}
                </span>
              ))}
            </div>

            {paso === "busqueda" && (
              <form className="mt-7 grid gap-6" onSubmit={buscar}>
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    Cuéntanos sobre tu viaje
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Define lo básico y calcularemos opciones de ejemplo para ti.
                  </p>
                </div>
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
                      className="min-h-12 rounded-xl border border-cyan-100/10 bg-[#0d2031] px-3 py-2 text-base font-normal text-texto outline-none transition focus-visible:border-acento/70 focus-visible:ring-2 focus-visible:ring-acento/20"
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
                <Boton
                  className="mt-1 min-h-12 w-full rounded-xl border-cyan-200/20 bg-gradient-to-r from-sky-700 to-cyan-700 text-base shadow-[0_0_28px_rgba(14,165,233,0.22)] transition hover:from-sky-600 hover:to-cyan-600 sm:w-fit sm:px-7"
                  type="submit"
                >
                  Ver mis opciones de viaje
                </Boton>
              </form>
            )}

            {paso === "opciones" && (
              <section
                className="mt-6 grid gap-6"
                aria-labelledby="titulo-servicios"
              >
                <div>
                  <h2
                    className="text-2xl font-extrabold tracking-tight text-white"
                    id="titulo-servicios"
                  >
                    Servicios de ejemplo para {destino}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {fechaInicio} – {fechaFin} · {noches}{" "}
                    {noches === 1 ? "noche" : "noches"} · {viajeros}{" "}
                    {viajeros === "1" ? "viajero" : "viajeros"} · Presupuesto{" "}
                    {formatearPesos(presupuestoNumero)} COP
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Los importes de muestra se ajustan al presupuesto diario por
                    viajero y a la duración del viaje.
                  </p>
                </div>

                {categorias.map((categoria) => {
                  if (categoria === "Hospedaje" && noches === 0) {
                    return (
                      <div
                        className="grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
                        key={categoria}
                      >
                        <h3 className="text-lg font-bold text-white">
                          {categoria}
                        </h3>
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
                      <h3 className="flex items-center gap-3 text-lg font-bold text-white">
                        <span className="h-px w-5 bg-acento shadow-[0_0_10px_#52ddff]" />
                        {categoria}
                      </h3>
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
                              className={`grid content-between gap-5 rounded-2xl border-white/[0.08] bg-gradient-to-br from-[#0d2133] to-[#0a1928] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-[0_16px_44px_rgba(0,170,255,0.1)] ${elegida ? "border-cyan-300/55 ring-1 ring-cyan-300/20" : ""}`}
                              key={oferta.id}
                            >
                              <div>
                                <h4 className="font-bold text-white">
                                  {oferta.nombre}
                                </h4>
                                <p className="mt-1 text-sm text-slate-400">
                                  {oferta.descripcion}
                                </p>
                                <p className="mt-3 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-200/80">
                                  Precio de ejemplo
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                                <p className="text-xl font-extrabold tracking-tight text-cyan-100">
                                  {formatearPesos(precio)} COP
                                </p>
                                <span className="w-full text-xs text-slate-500">
                                  Total de ejemplo para {viajeros}{" "}
                                  {viajeros === "1" ? "viajero" : "viajeros"} y{" "}
                                  {dias} {dias === 1 ? "día" : "días"}
                                </span>
                                <Boton
                                  aria-label={`${elegida ? "Quitar" : "Elegir"} ${oferta.nombre}`}
                                  aria-pressed={elegida}
                                  className={
                                    elegida
                                      ? "rounded-xl border-cyan-200/20 bg-cyan-950/60 text-cyan-100"
                                      : "rounded-xl border-cyan-200/20 bg-gradient-to-r from-sky-800 to-cyan-800 text-white shadow-[0_0_18px_rgba(14,165,233,0.12)] hover:from-sky-700 hover:to-cyan-700"
                                  }
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

                <Tarjeta className="grid gap-4 rounded-2xl border-cyan-300/20 bg-gradient-to-br from-[#0d263b] to-[#0a1928] p-5 shadow-[0_0_38px_rgba(0,180,255,0.07)] sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">Tu presupuesto</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Seleccionado de {formatearPesos(presupuestoNumero)} COP
                      </p>
                    </div>
                    <output
                      aria-label="Total seleccionado"
                      aria-live="polite"
                      className="text-2xl font-black tracking-tight text-cyan-100"
                    >
                      {formatearPesos(totalEjemplo)}{" "}
                      <span className="text-sm font-bold text-cyan-200/70">
                        COP
                      </span>
                    </output>
                  </div>
                  <div
                    aria-label="Presupuesto utilizado"
                    aria-valuemax={Math.max(presupuestoNumero, 1)}
                    aria-valuemin={0}
                    aria-valuenow={Math.min(totalEjemplo, presupuestoNumero)}
                    className="h-3 overflow-hidden rounded-full bg-[#06111f]"
                    role="meter"
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${superaPresupuesto ? "bg-gradient-to-r from-rose-500 to-red-400" : "bg-gradient-to-r from-sky-500 via-cyan-400 to-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.45)]"}`}
                      style={{ width: `${porcentajeUsado}%` }}
                    />
                  </div>
                  {superaPresupuesto ? (
                    <Aviso tipo="error">
                      Excedes el presupuesto por{" "}
                      {formatearPesos(Math.abs(saldoEjemplo))} COP. Cambia o
                      quita servicios para ajustar el ejemplo.
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
                <p className="text-2xl font-black text-cyan-100">
                  Total: {formatearPesos(totalEjemplo)} COP
                </p>
                <p>
                  {superaPresupuesto
                    ? `Excede el presupuesto por ${formatearPesos(Math.abs(saldoEjemplo))} COP.`
                    : `Quedarían ${formatearPesos(saldoEjemplo)} COP del presupuesto.`}
                </p>
                <Aviso
                  className="!text-cyan-100 border-cyan-400/25 bg-cyan-400/[0.08]"
                  tipo="informacion"
                >
                  Este resumen usa precios inventados. No es una cotización ni
                  una compra, y no se enviaron datos a proveedores.
                </Aviso>
                <div className="flex flex-wrap gap-3">
                  <Boton
                    onClick={() => setPaso("opciones")}
                    variante="secundario"
                  >
                    Volver a servicios
                  </Boton>
                  <Boton
                    className="rounded-xl border-cyan-200/20 bg-gradient-to-r from-sky-700 to-cyan-700 shadow-[0_0_24px_rgba(14,165,233,0.18)]"
                    onClick={() => setPaso("finalizada")}
                  >
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
                <Aviso
                  className="!text-cyan-100 border-cyan-400/25 bg-cyan-400/[0.08]"
                  tipo="informacion"
                >
                  Pudiste armar un presupuesto de ejemplo. No se compraron
                  servicios, no se crearon reservas y no se realizó ningún
                  cobro.
                </Aviso>
                <Boton
                  className="w-fit rounded-xl border-cyan-200/20 bg-gradient-to-r from-sky-700 to-cyan-700"
                  onClick={reiniciar}
                >
                  Planear otro viaje
                </Boton>
              </section>
            )}
          </Tarjeta>
        </div>
      </main>
    </div>
  );
}
