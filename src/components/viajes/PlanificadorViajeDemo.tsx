"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import { formatearPesos } from "@/lib/formato";
import { CLAVE_DATOS_INICIALES_PLANIFICADOR } from "@/lib/config/planificador";
import { duracionDias, finNoAnteriorAInicio } from "@/lib/reglas/fechas";
import { esquemaViaje } from "@/lib/validacion/esquemas";
import {
  calcularServiciosPlanViaje,
  catalogoServiciosViaje,
  validarServiciosPlanViaje,
} from "@/lib/reglas/planViaje";

type PasoDemo = "busqueda" | "opciones" | "revision" | "finalizada";
type OfertaDemo = (typeof catalogoServiciosViaje)[number];
const MAXIMO_PRESUPUESTO_COP = 1_000_000_000_000;

const categorias = [
  "Vuelos",
  "Hospedaje",
  "Carros",
  "Tours y actividades",
  "Artículos esenciales",
];

export function PlanificadorViajeDemo() {
  const deviceId = useDeviceId();
  const router = useRouter();
  const [paso, setPaso] = useState<PasoDemo>("busqueda");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [viajeros, setViajeros] = useState("2");
  const [presupuesto, setPresupuesto] = useState("");
  const [selecciones, setSelecciones] = useState<Record<string, string>>({});
  const [errorFechas, setErrorFechas] = useState("");
  const [errorPresupuesto, setErrorPresupuesto] = useState("");
  const [guardandoPlan, setGuardandoPlan] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [errorGuardado, setErrorGuardado] = useState("");
  const [requiereSesion, setRequiereSesion] = useState(false);
  const [datosPrecargados, setDatosPrecargados] = useState(false);
  const [errorPrecarga, setErrorPrecarga] = useState("");

  useEffect(() => {
    function mostrarError(mensaje: string) {
      startTransition(() => setErrorPrecarga(mensaje));
    }

    let datosGuardados: string | null;
    try {
      datosGuardados = sessionStorage.getItem(
        CLAVE_DATOS_INICIALES_PLANIFICADOR,
      );
      if (datosGuardados) {
        sessionStorage.removeItem(CLAVE_DATOS_INICIALES_PLANIFICADOR);
      }
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }
      mostrarError(
        "No se pudieron cargar los datos del viaje. Puedes ingresarlos manualmente.",
      );
      return;
    }

    if (!datosGuardados) {
      return;
    }

    let datosDesconocidos: unknown;
    try {
      datosDesconocidos = JSON.parse(datosGuardados);
    } catch {
      mostrarError(
        "Los datos guardados no se pudieron leer. Ingresa los datos del viaje nuevamente.",
      );
      return;
    }

    const resultado = esquemaViaje.safeParse(datosDesconocidos);
    if (
      !resultado.success ||
      resultado.data.presupuesto < 1 ||
      resultado.data.presupuesto > MAXIMO_PRESUPUESTO_COP ||
      !finNoAnteriorAInicio(
        resultado.data.fechaInicio,
        resultado.data.fechaFin,
      )
    ) {
      mostrarError(
        "Los datos del viaje no son válidos. Ingresa los datos nuevamente.",
      );
      return;
    }

    startTransition(() => {
      setDestino(resultado.data.destino);
      setFechaInicio(resultado.data.fechaInicio);
      setFechaFin(resultado.data.fechaFin);
      setPresupuesto(String(resultado.data.presupuesto));
      setDatosPrecargados(true);
    });
  }, []);

  const dias =
    fechaInicio && fechaFin && finNoAnteriorAInicio(fechaInicio, fechaFin)
      ? duracionDias(fechaInicio, fechaFin)
      : 0;
  const noches = Math.max(dias - 1, 0);
  const presupuestoNumero = Number(presupuesto);
  const ofertasElegidas = catalogoServiciosViaje.filter(
    (oferta) => selecciones[oferta.categoria] === oferta.id,
  );
  const serviciosElegidos = ofertasElegidas.map((oferta) => oferta.id);
  const datosCalculo =
    dias > 0 && Number.isSafeInteger(presupuestoNumero) && presupuestoNumero > 0
      ? {
          presupuesto: presupuestoNumero,
          dias,
          noches,
          viajeros: Number(viajeros),
        }
      : null;
  const serviciosDisponibles = datosCalculo
    ? catalogoServiciosViaje.flatMap((oferta) =>
        calcularServiciosPlanViaje([oferta.id], datosCalculo),
      )
    : [];
  const serviciosCalculados =
    datosCalculo && serviciosElegidos.length > 0
      ? calcularServiciosPlanViaje(serviciosElegidos, datosCalculo)
      : [];
  const totalEjemplo = serviciosCalculados.reduce(
    (total, servicio) => total + servicio.precio,
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

  async function guardarPlan() {
    if (!deviceId || !validarServiciosPlanViaje(serviciosElegidos)) {
      setErrorGuardado(
        "No se pudo preparar el plan. Selecciona al menos un servicio e inténtalo de nuevo.",
      );
      return;
    }

    setGuardandoPlan(true);
    setErrorGuardado("");
    setMensajeGuardado("");

    try {
      const respuesta = await fetch("/api/viajes/planes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          origen,
          destino,
          fechaInicio,
          fechaFin,
          presupuesto: presupuestoNumero,
          viajeros: Number(viajeros),
          servicios: serviciosElegidos,
        }),
      });
      const cuerpo: unknown = await respuesta.json();

      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          setRequiereSesion(true);
        }
        const mensaje =
          typeof cuerpo === "object" &&
          cuerpo !== null &&
          "error" in cuerpo &&
          typeof cuerpo.error === "object" &&
          cuerpo.error !== null &&
          "mensaje" in cuerpo.error &&
          typeof cuerpo.error.mensaje === "string"
            ? cuerpo.error.mensaje
            : "No se pudo guardar el plan. Inténtalo de nuevo.";
        throw new Error(mensaje);
      }

      setMensajeGuardado("Plan guardado. Volviendo a tus viajes…");
      router.push("/viajes?planGuardado=1");
    } catch (error) {
      setErrorGuardado(
        error instanceof TypeError
          ? "No se pudo conectar al guardar el plan. Revisa tu conexión e inténtalo de nuevo."
          : error instanceof Error
            ? error.message
            : "No se pudo guardar el plan. Inténtalo de nuevo.",
      );
    } finally {
      setGuardandoPlan(false);
    }
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
          {errorPrecarga && <Aviso tipo="error">{errorPrecarga}</Aviso>}

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
                {datosPrecargados && (
                  <Aviso tipo="informacion">
                    Completamos el destino, las fechas y el presupuesto de tu
                    viaje. Indica desde qué ciudad sales para ver los servicios
                    de ejemplo.
                  </Aviso>
                )}
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    Cuéntanos sobre tu viaje
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Define lo básico y calcularemos opciones de ejemplo para ti.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Campo
                    autoComplete="address-level2"
                    etiqueta="Ciudad o aeropuerto de origen"
                    name="origen"
                    onChange={(evento) => setOrigen(evento.target.value)}
                    placeholder="Ej. Bogotá"
                    required
                    value={origen}
                  />
                  <Campo
                    autoComplete="address-level2"
                    etiqueta="Ciudad o aeropuerto de destino"
                    name="destino"
                    onChange={(evento) => setDestino(evento.target.value)}
                    placeholder="Ej. Cartagena"
                    required
                    value={destino}
                  />
                </div>
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
                  <p className="mt-2 text-sm text-slate-400">
                    Las rutas y escalas también son ejemplos; no corresponden a
                    horarios ni vuelos disponibles.
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

                  const opciones = catalogoServiciosViaje.filter(
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
                          const precio = serviciosDisponibles.find(
                            (servicio) => servicio.id === oferta.id,
                          )?.precio;
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
                                {categoria === "Vuelos" && (
                                  <div className="mt-3 rounded-xl border border-cyan-100/10 bg-black/10 p-3 text-sm text-slate-200">
                                    <p>
                                      <span className="font-semibold text-cyan-100">
                                        Sale de:
                                      </span>{" "}
                                      {origen}
                                    </p>
                                    <p className="mt-1">
                                      <span className="font-semibold text-cyan-100">
                                        Llega a:
                                      </span>{" "}
                                      {destino}
                                    </p>
                                    <p className="mt-1">
                                      <span className="font-semibold text-cyan-100">
                                        Trayecto:
                                      </span>{" "}
                                      {oferta.numeroEscalas === 0
                                        ? "Directo (ejemplo)"
                                        : "1 escala (ejemplo; ciudad no confirmada)"}
                                    </p>
                                  </div>
                                )}
                                <p className="mt-3 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-200/80">
                                  Precio de ejemplo
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                                <p className="text-xl font-extrabold tracking-tight text-cyan-100">
                                  {precio === undefined
                                    ? "Precio no disponible"
                                    : `${formatearPesos(precio)} COP`}
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
                  {origen} → {destino} · {fechaInicio} – {fechaFin} · {viajeros}{" "}
                  {viajeros === "1" ? "viajero" : "viajeros"}
                </p>
                <ul className="grid gap-3">
                  {ofertasElegidas.map((oferta) => (
                    <li
                      className="flex flex-wrap justify-between gap-2 border-b border-borde pb-3"
                      key={oferta.id}
                    >
                      <span>
                        {oferta.nombre}
                        {oferta.categoria === "Vuelos" && (
                          <span className="mt-1 block text-sm text-texto-suave">
                            {origen} → {destino} ·{" "}
                            {oferta.numeroEscalas === 0
                              ? "directo (ejemplo)"
                              : "1 escala de ejemplo"}
                          </span>
                        )}
                      </span>
                      <strong>
                        {formatearPesos(
                          serviciosCalculados.find(
                            (servicio) => servicio.id === oferta.id,
                          )?.precio ?? 0,
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
                <Aviso tipo="informacion">
                  Puedes guardar esta selección en tus viajes para consultarla
                  después. Quedará marcada como plan de ejemplo, no como compra.
                </Aviso>
                {errorGuardado && (
                  <Aviso tipo="error">
                    {errorGuardado}{" "}
                    {requiereSesion && (
                      <Link
                        className="font-bold underline underline-offset-2"
                        href="/login"
                      >
                        Inicia sesión y vuelve a armar el plan para guardarlo.
                      </Link>
                    )}
                  </Aviso>
                )}
                {mensajeGuardado && (
                  <Aviso
                    className="!text-cyan-100 border-cyan-400/25 bg-cyan-400/[0.08]"
                    tipo="informacion"
                  >
                    {mensajeGuardado}
                  </Aviso>
                )}
                <div className="flex flex-wrap gap-3">
                  <Boton
                    className="rounded-xl border-cyan-200/20 bg-gradient-to-r from-sky-800 to-cyan-800"
                    disabled={guardandoPlan || !deviceId}
                    onClick={() => void guardarPlan()}
                  >
                    {guardandoPlan
                      ? "Guardando plan…"
                      : "Guardar en mis viajes"}
                  </Boton>
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
