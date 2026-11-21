"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { AutocompletarAeropuerto } from "@/components/viajes/AutocompletarAeropuerto";
import { mensajeErrorDeRespuesta } from "@/components/viajes/respuestaApi";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import { formatearPesos } from "@/lib/formato";
import { CLAVE_DATOS_INICIALES_PLANIFICADOR } from "@/lib/config/planificador";
import { duracionDias, finNoAnteriorAInicio } from "@/lib/reglas/fechas";
import {
  esquemaDatosInicialesPlanificador,
  esquemaOpcionVuelo,
} from "@/lib/validacion/esquemas";
import {
  filtrarVuelosPorTipo,
  type Aeropuerto,
  type OpcionVuelo,
  type TipoRutaVuelo,
} from "@/lib/reglas/vuelos";
import {
  calcularServiciosPlanViaje,
  catalogoServiciosViaje,
  validarServiciosPlanViaje,
} from "@/lib/reglas/planViaje";

type PasoPlanificador = "busqueda" | "opciones" | "revision" | "finalizada";
type OfertaPlanificada = (typeof catalogoServiciosViaje)[number];
type TipoRuta = TipoRutaVuelo;
const MAXIMO_PRESUPUESTO_COP = 1_000_000_000_000;
const MARCA_AEROPUERTO = " · Aeropuerto: ";

const categorias = [
  "Vuelos",
  "Hospedaje",
  "Carros",
  "Tours y actividades",
  "Artículos esenciales",
];

function leerDestinoGuardado(valor: string) {
  const indiceAeropuerto = valor.lastIndexOf(MARCA_AEROPUERTO);

  if (indiceAeropuerto < 0) {
    return { destino: valor, aeropuertoLlegada: "" };
  }

  return {
    destino: valor.slice(0, indiceAeropuerto),
    aeropuertoLlegada: valor
      .slice(indiceAeropuerto + MARCA_AEROPUERTO.length)
      .trim(),
  };
}

function etiquetaAeropuerto(aeropuerto: Aeropuerto): string {
  return `${aeropuerto.ciudad} — ${aeropuerto.nombre} (${aeropuerto.codigo})`;
}

function leerAeropuertoGuardado(
  ciudad: string,
  etiqueta: string,
  incluirCiudad: boolean,
): Aeropuerto | null {
  const patron = incluirCiudad
    ? /^(.*?) — (.*?) \(([A-Z]{3})\)$/
    : /^(.*?) \(([A-Z]{3})\)$/;
  const coincidencia = etiqueta.match(patron);

  if (!coincidencia) {
    return null;
  }

  const codigo = incluirCiudad ? coincidencia[3] : coincidencia[2];
  const nombre = incluirCiudad ? coincidencia[2] : coincidencia[1];

  if (!codigo || !nombre) {
    return null;
  }

  return {
    codigo,
    nombre,
    ciudad: incluirCiudad ? coincidencia[1]! : ciudad,
    pais: "",
    codigoPais: "",
  };
}

interface RespuestaOfertasVuelo {
  ok: true;
  datos: { ofertas: OpcionVuelo[] };
}

function esRespuestaOfertasVuelo(
  valor: unknown,
): valor is RespuestaOfertasVuelo {
  if (typeof valor !== "object" || valor === null || !("ok" in valor)) {
    return false;
  }

  const respuesta = valor as { ok: unknown; datos?: { ofertas?: unknown } };
  return (
    respuesta.ok === true &&
    Array.isArray(respuesta.datos?.ofertas) &&
    respuesta.datos.ofertas.every(
      (oferta) => esquemaOpcionVuelo.safeParse(oferta).success,
    )
  );
}

function nombreOfertaViaje(oferta: OfertaPlanificada): string {
  if (oferta.categoria !== "Vuelos") {
    return oferta.nombre;
  }

  return oferta.numeroEscalas === 0
    ? "Vuelo sin escalas estimado"
    : "Vuelo con 1 escala estimada";
}

function mostrarFechaHora(valor: string): string {
  return `${valor.slice(0, 10)} · ${valor.slice(11, 16)}`;
}

function nombreVuelos(segmentos: OpcionVuelo["segmentosIda"]): string {
  return segmentos
    .map((segmento) => `${segmento.codigoAerolinea}${segmento.numeroVuelo}`)
    .join(" · ");
}

export function PlanificadorViaje() {
  const deviceId = useDeviceId();
  const router = useRouter();
  const [paso, setPaso] = useState<PasoPlanificador>("busqueda");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [aeropuertoOrigen, setAeropuertoOrigen] = useState<Aeropuerto | null>(
    null,
  );
  const [aeropuertoLlegada, setAeropuertoLlegada] =
    useState<Aeropuerto | null>(null);
  const [tipoRuta, setTipoRuta] = useState<TipoRuta>("nacional");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [viajeros, setViajeros] = useState("2");
  const [presupuesto, setPresupuesto] = useState("");
  const [selecciones, setSelecciones] = useState<Record<string, string>>({});
  const [errorFechas, setErrorFechas] = useState("");
  const [errorOrigen, setErrorOrigen] = useState("");
  const [errorPresupuesto, setErrorPresupuesto] = useState("");
  const [guardandoPlan, setGuardandoPlan] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [errorGuardado, setErrorGuardado] = useState("");
  const [requiereSesion, setRequiereSesion] = useState(false);
  const [datosPrecargados, setDatosPrecargados] = useState(false);
  const [errorPrecarga, setErrorPrecarga] = useState("");
  const [errorAeropuerto, setErrorAeropuerto] = useState("");
  const [ofertasVuelo, setOfertasVuelo] = useState<OpcionVuelo[]>([]);
  const [vueloSeleccionado, setVueloSeleccionado] =
    useState<OpcionVuelo | null>(null);
  const [buscandoVuelos, setBuscandoVuelos] = useState(false);
  const [errorVuelos, setErrorVuelos] = useState("");

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

    const resultado =
      esquemaDatosInicialesPlanificador.safeParse(datosDesconocidos);
    if (
      !resultado.success ||
      resultado.data.presupuesto > MAXIMO_PRESUPUESTO_COP
    ) {
      mostrarError(
        "Los datos del viaje no son válidos. Ingresa los datos nuevamente.",
      );
      return;
    }

    startTransition(() => {
      const origenGuardado = resultado.data.origen ?? "";
      setOrigen(origenGuardado);
      setAeropuertoOrigen(
        leerAeropuertoGuardado(origenGuardado, origenGuardado, true),
      );
      const datosDestino = leerDestinoGuardado(resultado.data.destino);
      const aeropuertoDestinoGuardado = leerAeropuertoGuardado(
        datosDestino.destino,
        datosDestino.aeropuertoLlegada,
        false,
      );
      setDestino(
        aeropuertoDestinoGuardado
          ? etiquetaAeropuerto(aeropuertoDestinoGuardado)
          : datosDestino.destino,
      );
      setAeropuertoLlegada(aeropuertoDestinoGuardado);
      setTipoRuta(
        resultado.data.vuelo?.tipoRuta === "internacional" ||
          resultado.data.servicios?.includes("vuelo-flexible")
          ? "internacional"
          : "nacional",
      );
      if (resultado.data.vuelo) {
        setOfertasVuelo([resultado.data.vuelo]);
        setVueloSeleccionado(resultado.data.vuelo);
      }
      setFechaInicio(resultado.data.fechaInicio);
      setFechaFin(resultado.data.fechaFin);
      setPresupuesto(String(resultado.data.presupuesto));
      setViajeros(String(resultado.data.viajeros ?? 2));
      setDatosPrecargados(
        resultado.data.servicios === undefined && !resultado.data.vuelo,
      );
      if (resultado.data.servicios || resultado.data.vuelo) {
        setSelecciones(
          Object.fromEntries(
            (resultado.data.servicios ?? [])
              .filter(
                (id) =>
                  !resultado.data.vuelo ||
                  (id !== "vuelo-economico" && id !== "vuelo-flexible"),
              )
              .map((id) => {
              const oferta = catalogoServiciosViaje.find(
                (candidata) => candidata.id === id,
              );
              return [oferta?.categoria ?? "", id];
              }),
          ),
        );
        setPaso("opciones");
      }
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
    vueloSeleccionado?.precio ?? 0,
  );
  const saldoEjemplo = presupuestoNumero - totalEjemplo;
  const superaPresupuesto = saldoEjemplo < 0;
  const porcentajeUsado =
    presupuestoNumero > 0
      ? Math.min((totalEjemplo / presupuestoNumero) * 100, 100)
      : totalEjemplo > 0
        ? 100
        : 0;

  async function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorFechas("");
    setErrorOrigen("");
    setErrorAeropuerto("");
    setErrorPresupuesto("");
    setErrorVuelos("");

    if (!aeropuertoOrigen) {
      setErrorOrigen("Selecciona el aeropuerto de salida de la lista.");
      return;
    }

    if (!aeropuertoLlegada) {
      setErrorAeropuerto("Selecciona el aeropuerto de llegada de la lista.");
      return;
    }

    if (!finNoAnteriorAInicio(fechaInicio, fechaFin)) {
      setErrorFechas(
        "La fecha de regreso no puede ser anterior a la fecha de ida.",
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

    const parametros = new URLSearchParams({
      origen: aeropuertoOrigen.codigo,
      destino: aeropuertoLlegada.codigo,
      fechaIda: fechaInicio,
      viajeros,
      tipoRuta,
    });

    if (fechaFin > fechaInicio) {
      parametros.set("fechaRegreso", fechaFin);
    }

    setBuscandoVuelos(true);
    setVueloSeleccionado(null);

    try {
      const respuesta = await fetch(
        `/api/viajes/vuelos?${parametros.toString()}`,
        { cache: "no-store" },
      );
      if (!respuesta.ok) {
        throw new Error(
          await mensajeErrorDeRespuesta(
            respuesta,
            "No se pudieron consultar vuelos para esta ruta.",
          ),
        );
      }

      let cuerpo: unknown;
      try {
        cuerpo = await respuesta.json();
      } catch (errorRespuesta) {
        if (errorRespuesta instanceof SyntaxError) {
          throw new Error("El servidor devolvió una respuesta inválida.");
        }
        throw errorRespuesta;
      }

      if (!esRespuestaOfertasVuelo(cuerpo)) {
        throw new Error("El servidor devolvió ofertas de vuelo inválidas.");
      }

      setOfertasVuelo(
        filtrarVuelosPorTipo(cuerpo.datos.ofertas, tipoRuta),
      );
      setSelecciones((seleccionesActuales) => {
        const siguientes = { ...seleccionesActuales };
        delete siguientes.Vuelos;
        return siguientes;
      });
      setPaso("opciones");
    } catch (error) {
      setErrorVuelos(
        error instanceof TypeError
          ? "No se pudo conectar para consultar vuelos."
          : error instanceof Error
            ? error.message
            : "No se pudieron consultar vuelos para esta ruta.",
      );
    } finally {
      setBuscandoVuelos(false);
    }
  }

  function alternarVuelo(oferta: OpcionVuelo) {
    setVueloSeleccionado((actual) =>
      actual?.id === oferta.id ? null : oferta,
    );
  }

  function alternarOferta(oferta: OfertaPlanificada) {
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
    setOfertasVuelo([]);
    setVueloSeleccionado(null);
    setErrorFechas("");
    setErrorVuelos("");
  }

  async function guardarPlan() {
    if (!aeropuertoOrigen || !aeropuertoLlegada) {
      setErrorGuardado(
        "Selecciona los aeropuertos de salida y llegada antes de guardar.",
      );
      return;
    }

    const serviciosValidos =
      serviciosElegidos.length === 0 ||
      validarServiciosPlanViaje(serviciosElegidos);
    if (
      !deviceId ||
      !serviciosValidos ||
      (serviciosElegidos.length === 0 && !vueloSeleccionado)
    ) {
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
          origen: etiquetaAeropuerto(aeropuertoOrigen),
          destino: `${aeropuertoLlegada.ciudad}${MARCA_AEROPUERTO}${aeropuertoLlegada.nombre} (${aeropuertoLlegada.codigo})`,
          fechaInicio,
          fechaFin,
          presupuesto: presupuestoNumero,
          viajeros: Number(viajeros),
          servicios: serviciosElegidos,
          ...(vueloSeleccionado ? { vuelo: vueloSeleccionado } : {}),
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
            <span className="font-bold text-acento">VUELOS ·</span> Los
            aeropuertos y tarifas se consultan en Amadeus. Los resultados pueden
            cambiar y no crean reservas ni cobros. Hospedajes, transporte,
            actividades y artículos siguen siendo estimaciones.
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
              Organiza vuelos, hospedaje, transporte, actividades y artículos
              esenciales, y compara sus importes estimados con tu presupuesto.
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
                    Completamos parte del viaje. Selecciona de nuevo los
                    aeropuertos para consultar ofertas actualizadas.
                  </Aviso>
                )}
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    Cuéntanos sobre tu viaje
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Elige aeropuertos reales y fechas para consultar vuelos.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <AutocompletarAeropuerto
                    id="origen"
                    etiqueta="Ciudad de salida"
                    error={errorOrigen || undefined}
                    aeropuertoSeleccionado={aeropuertoOrigen}
                    alCambiar={(valor, aeropuerto) => {
                      setOrigen(valor);
                      setAeropuertoOrigen(aeropuerto);
                      setVueloSeleccionado(null);
                      setErrorOrigen("");
                    }}
                    placeholder="Ej. Bogotá"
                    tipoRuta={tipoRuta}
                    valor={origen}
                  />
                  <AutocompletarAeropuerto
                    id="destino"
                    etiqueta="Ciudad y aeropuerto de llegada"
                    error={errorAeropuerto || undefined}
                    aeropuertoSeleccionado={aeropuertoLlegada}
                    alCambiar={(valor, aeropuerto) => {
                      setDestino(valor);
                      setAeropuertoLlegada(aeropuerto);
                      setVueloSeleccionado(null);
                      setErrorAeropuerto("");
                    }}
                    placeholder="Ej. Cartagena o Madrid"
                    tipoRuta={tipoRuta}
                    valor={destino}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid max-w-sm gap-2 text-sm font-semibold">
                    Tipo de ruta
                    <select
                      className="min-h-12 rounded-xl border border-cyan-100/10 bg-[#0d2031] px-3 py-2 text-base font-normal text-texto outline-none transition focus-visible:border-acento/70 focus-visible:ring-2 focus-visible:ring-acento/20"
                      name="tipoRuta"
                      onChange={(evento) => {
                        const valor = evento.target.value;
                        if (valor === "nacional" || valor === "internacional") {
                          setTipoRuta(valor);
                          setOrigen("");
                          setDestino("");
                          setAeropuertoOrigen(null);
                          setAeropuertoLlegada(null);
                          setOfertasVuelo([]);
                          setVueloSeleccionado(null);
                          setErrorOrigen("");
                          setErrorAeropuerto("");
                        }
                      }}
                      value={tipoRuta}
                    >
                      <option value="nacional">Nacional (Colombia)</option>
                      <option value="internacional">Internacional</option>
                    </select>
                  </label>
                  <p className="text-sm text-slate-400 sm:col-span-2">
                    Las rutas nacionales se buscan únicamente sin escalas y
                    con aeropuertos de Colombia.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Campo
                    etiqueta="Fecha de ida"
                    name="fechaInicio"
                    onChange={(evento) => setFechaInicio(evento.target.value)}
                    required
                    type="date"
                    value={fechaInicio}
                  />
                  <Campo
                    etiqueta="Fecha de regreso"
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
                {errorVuelos && <Aviso tipo="error">{errorVuelos}</Aviso>}
                <Boton
                  className="mt-1 min-h-12 w-full rounded-xl border-cyan-200/20 bg-gradient-to-r from-sky-700 to-cyan-700 text-base shadow-[0_0_28px_rgba(14,165,233,0.22)] transition hover:from-sky-600 hover:to-cyan-600 sm:w-fit sm:px-7"
                  disabled={buscandoVuelos}
                  type="submit"
                >
                  {buscandoVuelos ? "Consultando vuelos…" : "Consultar vuelos"}
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
                    Opciones de viaje para{" "}
                    {aeropuertoLlegada?.ciudad ?? destino}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {fechaInicio} – {fechaFin} · {noches}{" "}
                    {noches === 1 ? "noche" : "noches"} · {viajeros}{" "}
                    {viajeros === "1" ? "viajero" : "viajeros"} · Presupuesto{" "}
                    {formatearPesos(presupuestoNumero)} COP
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Las tarifas de vuelo se consultaron en Amadeus. Los demás
                    servicios se calculan con tu presupuesto y son estimados.
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Llegada: {aeropuertoLlegada?.nombre} (
                    {aeropuertoLlegada?.codigo}) · {aeropuertoLlegada?.ciudad}
                  </p>
                </div>

                {categorias.map((categoria) => {
                  if (categoria === "Vuelos") {
                    const ofertasLegadas = catalogoServiciosViaje.filter(
                      (oferta) =>
                        oferta.categoria === "Vuelos" &&
                        (tipoRuta === "internacional" ||
                          oferta.numeroEscalas === 0),
                    );

                    return (
                      <section
                        aria-labelledby="titulo-vuelos"
                        className="grid gap-3"
                        key={categoria}
                      >
                        <div>
                          <h3
                            className="flex items-center gap-3 text-lg font-bold text-white"
                            id="titulo-vuelos"
                          >
                            <span className="h-px w-5 bg-acento shadow-[0_0_10px_#52ddff]" />
                            Vuelos consultados en Amadeus
                          </h3>
                          <p className="mt-2 text-sm text-slate-400">
                            Tarifas para {viajeros}{" "}
                            {viajeros === "1" ? "viajero" : "viajeros"} en COP.
                            La disponibilidad y el precio pueden cambiar antes
                            de comprar.
                          </p>
                        </div>
                        {ofertasVuelo.length === 0 && (
                          <Aviso tipo="informacion">
                            {tipoRuta === "nacional"
                              ? "No encontramos vuelos nacionales sin escalas para estas fechas. No mostramos opciones con escalas."
                              : "No encontramos ofertas de vuelos para esta ruta y estas fechas."}
                          </Aviso>
                        )}
                        <div className="grid gap-3">
                          {ofertasVuelo.map((oferta) => {
                            const elegida = vueloSeleccionado?.id === oferta.id;
                            const vuelosIda = nombreVuelos(oferta.segmentosIda);
                            const vuelosRegreso = nombreVuelos(
                              oferta.segmentosRegreso,
                            );
                            const itinerarios = [
                              {
                                nombre: "Ida",
                                segmentos: oferta.segmentosIda,
                              },
                              {
                                nombre: "Regreso",
                                segmentos: oferta.segmentosRegreso,
                              },
                            ].filter((itinerario) => itinerario.segmentos.length > 0);

                            return (
                              <Tarjeta
                                className={`grid gap-4 rounded-2xl border-white/[0.08] bg-gradient-to-br from-[#0d2133] to-[#0a1928] p-5 transition ${elegida ? "border-cyan-300/55 ring-1 ring-cyan-300/20" : ""}`}
                                key={oferta.id}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-bold text-white">
                                      {oferta.aerolinea}
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-300">
                                      Ida: {vuelosIda} ·{" "}
                                      {oferta.escalasIda === 0
                                        ? "sin escalas"
                                        : `${oferta.escalasIda} escalas`}
                                    </p>
                                    {oferta.segmentosRegreso.length > 0 && (
                                      <p className="mt-1 text-sm text-slate-300">
                                        Regreso: {vuelosRegreso} ·{" "}
                                        {oferta.escalasRegreso === 0
                                          ? "sin escalas"
                                          : `${oferta.escalasRegreso} escalas`}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-xl font-extrabold text-cyan-100">
                                    {formatearPesos(oferta.precio)} COP
                                  </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {itinerarios.map((itinerario) => (
                                      <div
                                        className="rounded-xl border border-cyan-100/10 bg-black/10 p-3"
                                        key={itinerario.nombre}
                                      >
                                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-100">
                                          {itinerario.nombre}
                                        </p>
                                        {itinerario.segmentos.map(
                                          (tramo, indice) => (
                                            <p
                                              className="text-sm text-slate-200"
                                              key={`${tramo.numeroVuelo}-${indice}`}
                                            >
                                              {tramo.origenCodigo}{" "}
                                              {mostrarFechaHora(tramo.salida)}{" "}
                                              → {tramo.destinoCodigo}{" "}
                                              {mostrarFechaHora(tramo.llegada)}
                                              <span className="block text-xs text-slate-400">
                                                {tramo.aerolinea}{" "}
                                                {tramo.codigoAerolinea}
                                                {tramo.numeroVuelo} ·{" "}
                                                {tramo.duracion}
                                              </span>
                                            </p>
                                          ),
                                        )}
                                      </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                                  <span className="text-xs text-slate-400">
                                    Consultado el{" "}
                                    {oferta.consultadoEn.slice(0, 10)} · Tarifa
                                    {oferta.id.startsWith("ejemplo-")
                                      ? " ilustrativa; no está confirmada ni es una reserva."
                                      : " sujeta a cambios; no es una reserva."}
                                  </span>
                                  <Boton
                                    aria-label={`${elegida ? "Quitar" : "Elegir"} vuelo ${oferta.aerolinea} ${vuelosIda}`}
                                    aria-pressed={elegida}
                                    onClick={() => alternarVuelo(oferta)}
                                    variante={
                                      elegida ? "secundario" : "primario"
                                    }
                                  >
                                    {elegida ? "Vuelo elegido" : "Elegir vuelo"}
                                  </Boton>
                                </div>
                              </Tarjeta>
                            );
                          })}
                        </div>
                        {ofertasVuelo.length === 0 &&
                          ofertasLegadas
                            .filter(
                              (oferta) =>
                                selecciones.Vuelos === oferta.id,
                            )
                            .map((oferta) => (
                              <Tarjeta
                                className="grid gap-3 rounded-2xl border-amber-200/20 bg-amber-300/[0.04] p-5"
                                key={oferta.id}
                              >
                                <div>
                                  <h4 className="font-bold text-white">
                                    {nombreOfertaViaje(oferta)} · selección
                                    anterior
                                  </h4>
                                  <p className="mt-1 text-sm text-slate-300">
                                    Este importe es una estimación guardada, no
                                    una tarifa consultada.
                                  </p>
                                  <p className="mt-2 font-bold text-amber-100">
                                    {formatearPesos(
                                      serviciosDisponibles.find(
                                        (servicio) => servicio.id === oferta.id,
                                      )?.precio ?? 0,
                                    )}{" "}
                                    COP
                                  </p>
                                </div>
                                <Boton
                                  onClick={() => alternarOferta(oferta)}
                                  variante="secundario"
                                >
                                  Quitar estimación
                                </Boton>
                              </Tarjeta>
                            ))}
                      </section>
                    );
                  }

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
                          const nombreOferta = nombreOfertaViaje(oferta);

                          return (
                            <Tarjeta
                              className={`grid content-between gap-5 rounded-2xl border-white/[0.08] bg-gradient-to-br from-[#0d2133] to-[#0a1928] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-[0_16px_44px_rgba(0,170,255,0.1)] ${elegida ? "border-cyan-300/55 ring-1 ring-cyan-300/20" : ""}`}
                              key={oferta.id}
                            >
                              <div>
                                <h4 className="font-bold text-white">
                                  {nombreOferta}
                                </h4>
                                <p className="mt-1 text-sm text-slate-400">
                                  {oferta.descripcion}
                                </p>
                                <p className="mt-3 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-200/80">
                                  Precio estimado
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                                <p className="text-xl font-extrabold tracking-tight text-cyan-100">
                                  {precio === undefined
                                    ? "Precio no disponible"
                                    : `${formatearPesos(precio)} COP`}
                                </p>
                                <span className="w-full text-xs text-slate-500">
                                  Total estimado para {viajeros}{" "}
                                  {viajeros === "1" ? "viajero" : "viajeros"} y{" "}
                                  {dias} {dias === 1 ? "día" : "días"}
                                </span>
                                <Boton
                                  aria-label={`${elegida ? "Quitar" : "Elegir"} ${nombreOferta}`}
                                  aria-pressed={elegida}
                                  className={
                                    elegida
                                      ? "rounded-xl border-cyan-200/20 bg-cyan-950/60 text-cyan-100"
                                      : "rounded-xl border-cyan-200/20 bg-gradient-to-r from-sky-800 to-cyan-800 text-white shadow-[0_0_18px_rgba(14,165,233,0.12)] hover:from-sky-700 hover:to-cyan-700"
                                  }
                                  onClick={() => alternarOferta(oferta)}
                                  variante={elegida ? "secundario" : "primario"}
                                >
                                  {elegida ? "Quitar" : "Elegir opción"}
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
                        Vuelo consultado y servicios de referencia ·{" "}
                        {formatearPesos(presupuestoNumero)} COP
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
                      quita servicios para ajustarlo.
                    </Aviso>
                  ) : (
                    <p className="text-sm text-texto-suave">
                      Saldo disponible:{" "}
                      <strong>{formatearPesos(saldoEjemplo)} COP</strong>
                    </p>
                  )}
                </Tarjeta>

                <div className="flex flex-wrap gap-3">
                  <Boton onClick={reiniciar} variante="fantasma">
                    Cambiar datos del viaje
                  </Boton>
                  <Boton
                    disabled={
                      ofertasElegidas.length === 0 && !vueloSeleccionado
                    }
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
                  Resumen de tu viaje
                </h2>
                <p className="text-sm text-texto-suave">
                  {aeropuertoOrigen?.ciudad} ({aeropuertoOrigen?.codigo}) →{" "}
                  {aeropuertoLlegada?.ciudad} ({aeropuertoLlegada?.codigo}) ·{" "}
                  {fechaInicio} – {fechaFin} · {viajeros}{" "}
                  {viajeros === "1" ? "viajero" : "viajeros"}
                </p>
                <ul className="grid gap-3">
                  {vueloSeleccionado && (
                    <li className="flex flex-wrap justify-between gap-2 border-b border-borde pb-3">
                      <span>
                        Vuelo consultado · {vueloSeleccionado.aerolinea}
                        <span className="mt-1 block text-sm text-texto-suave">
                          Ida: {nombreVuelos(vueloSeleccionado.segmentosIda)} ·{" "}
                          {vueloSeleccionado.escalasIda === 0
                            ? "sin escalas"
                            : `${vueloSeleccionado.escalasIda} escalas`}
                          {vueloSeleccionado.segmentosRegreso.length > 0 &&
                            ` · Regreso: ${nombreVuelos(vueloSeleccionado.segmentosRegreso)}`}
                          {" · "}
                          Llegada a {aeropuertoLlegada?.nombre} (
                          {aeropuertoLlegada?.codigo})
                        </span>
                      </span>
                      <strong>
                        {formatearPesos(vueloSeleccionado.precio)} COP
                      </strong>
                    </li>
                  )}
                  {ofertasElegidas.map((oferta) => (
                    <li
                      className="flex flex-wrap justify-between gap-2 border-b border-borde pb-3"
                      key={oferta.id}
                    >
                      <span>
                        {nombreOfertaViaje(oferta)}
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
                  Total del plan: {formatearPesos(totalEjemplo)} COP
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
                  El vuelo se consultó en Amadeus y su precio puede cambiar. Los
                  demás importes son estimaciones. No se creó una reserva ni se
                  hizo una compra.
                </Aviso>
                <Aviso tipo="informacion">
                  Puedes guardar esta selección en tus viajes para consultarla
                  después. Quedará como plan, no como compra.
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
                    Finalizar planificación
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
                  Planificación terminada
                </h2>
                <Aviso
                  className="!text-cyan-100 border-cyan-400/25 bg-cyan-400/[0.08]"
                  tipo="informacion"
                >
                  No se compraron servicios, no se crearon reservas y no se
                  realizó ningún cobro.
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
