"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { mensajeErrorDeRespuesta } from "@/components/viajes/respuestaApi";
import {
  DESTINO_MAX,
  DESTINO_MIN,
  PRESUPUESTO_MINIMO,
} from "@/lib/config/viajes";
import type { DatosViaje, Viaje } from "@/lib/datos/tipos";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { esFechaValida } from "@/lib/reglas/fechas";
import { validarViaje } from "@/lib/reglas/viaje";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import { CLAVE_DATOS_INICIALES_PLANIFICADOR } from "@/lib/config/planificador";

interface ValoresFormulario {
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: string;
}

type CampoFormulario = keyof ValoresFormulario;
type ErroresFormulario = Partial<Record<CampoFormulario, string>>;
type CamposTocados = Partial<Record<CampoFormulario, boolean>>;

interface FormularioViajeProps {
  viaje: Viaje | null;
  alGuardar: (modo: "crear" | "editar") => void;
  alCancelarEdicion: () => void;
  alInteractuar: () => void;
}

const valoresVacios: ValoresFormulario = {
  destino: "",
  fechaInicio: "",
  fechaFin: "",
  presupuesto: "",
};

function valoresIniciales(viaje: Viaje | null): ValoresFormulario {
  if (!viaje) {
    return valoresVacios;
  }

  return {
    destino: viaje.destino,
    fechaInicio: viaje.fechaInicio,
    fechaFin: viaje.fechaFin,
    presupuesto: String(viaje.presupuesto),
  };
}

function validarCampos(valores: ValoresFormulario): ErroresFormulario {
  const errores: ErroresFormulario = {};
  const destino = valores.destino.trim();
  const inicioValido = esFechaValida(valores.fechaInicio);
  const finValido = esFechaValida(valores.fechaFin);
  const presupuesto = Number(valores.presupuesto);

  if (!destino) {
    errores.destino = "El destino es obligatorio.";
  }

  if (!valores.fechaInicio) {
    errores.fechaInicio = "La fecha de inicio es obligatoria.";
  } else if (!inicioValido) {
    errores.fechaInicio = "Ingresa una fecha de inicio válida.";
  }

  if (!valores.fechaFin) {
    errores.fechaFin = "La fecha de fin es obligatoria.";
  } else if (!finValido) {
    errores.fechaFin = "Ingresa una fecha de fin válida.";
  }

  if (valores.presupuesto === "") {
    errores.presupuesto = "El presupuesto es obligatorio.";
  } else if (
    !Number.isSafeInteger(presupuesto) ||
    presupuesto < PRESUPUESTO_MINIMO
  ) {
    errores.presupuesto = "Ingresa un presupuesto entero igual o mayor a 0.";
  }

  if (Object.keys(errores).length > 0) {
    return errores;
  }

  try {
    validarViaje({
      destino,
      fechaInicio: valores.fechaInicio,
      fechaFin: valores.fechaFin,
      presupuesto,
    });
  } catch (error) {
    if (error instanceof ErrorDeNegocio) {
      if (error.codigo === "FECHA_FIN_ANTERIOR") {
        errores.fechaFin = error.message;
      } else if (destino.length < DESTINO_MIN || destino.length > DESTINO_MAX) {
        errores.destino = `El destino debe tener entre ${DESTINO_MIN} y ${DESTINO_MAX} caracteres.`;
      } else {
        errores.presupuesto = error.message;
      }
    } else {
      throw error;
    }
  }

  return errores;
}

export function FormularioViaje({
  alCancelarEdicion,
  alInteractuar,
  alGuardar,
  viaje,
}: FormularioViajeProps) {
  const deviceId = useDeviceId();
  const router = useRouter();
  const [valores, setValores] = useState(() => valoresIniciales(viaje));
  const [tocados, setTocados] = useState<CamposTocados>({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const errores = validarCampos(valores);
  const esEdicion = viaje !== null;

  function cambiarCampo(campo: CampoFormulario, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setTocados((actuales) => ({ ...actuales, [campo]: true }));
    setMensajeError("");
    alInteractuar();
  }

  function mostrarError(campo: CampoFormulario): string | undefined {
    return intentoGuardar || tocados[campo] ? errores[campo] : undefined;
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setIntentoGuardar(true);
    setMensajeError("");

    const erroresActuales = validarCampos(valores);
    if (Object.keys(erroresActuales).length > 0) {
      return;
    }

    if (!deviceId) {
      setMensajeError(
        "No se pudo identificar este dispositivo. Recarga la página e inténtalo de nuevo.",
      );
      return;
    }

    const datos: DatosViaje = {
      destino: valores.destino.trim(),
      fechaInicio: valores.fechaInicio,
      fechaFin: valores.fechaFin,
      presupuesto: Number(valores.presupuesto),
    };

    setGuardando(true);
    try {
      const respuesta = await fetch(
        esEdicion
          ? `/api/viajes/${encodeURIComponent(viaje.id)}`
          : "/api/viajes",
        {
          method: esEdicion ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, ...datos }),
        },
      );

      if (!respuesta.ok) {
        throw new Error(
          await mensajeErrorDeRespuesta(
            respuesta,
            "No se pudo guardar el viaje. Inténtalo de nuevo.",
          ),
        );
      }

      if (!esEdicion) {
        try {
          sessionStorage.setItem(
            CLAVE_DATOS_INICIALES_PLANIFICADOR,
            JSON.stringify(datos),
          );
        } catch (error) {
          if (!(error instanceof DOMException)) {
            throw error;
          }

          alGuardar("crear");
          setMensajeError(
            "El viaje se guardó, pero el navegador no pudo preparar los servicios. Abre «Armar viaje según presupuesto» para continuar.",
          );
          setValores(valoresVacios);
          setTocados({});
          setIntentoGuardar(false);
          return;
        }

        alGuardar("crear");
        router.push("/demo-compras");
      } else {
        alGuardar("editar");
      }

      if (!esEdicion) {
        setValores(valoresVacios);
        setTocados({});
        setIntentoGuardar(false);
      }
    } catch (error) {
      setMensajeError(
        error instanceof TypeError
          ? "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
          : error instanceof Error
            ? error.message
            : "No se pudo guardar el viaje. Inténtalo de nuevo.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={guardar}>
      {mensajeError && <Aviso tipo="error">{mensajeError}</Aviso>}

      <Campo
        autoComplete="off"
        etiqueta="Destino"
        error={mostrarError("destino")}
        maxLength={DESTINO_MAX}
        name="destino"
        onChange={(evento) => cambiarCampo("destino", evento.target.value)}
        placeholder="Ej. Cartagena"
        required
        value={valores.destino}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          etiqueta="Fecha de inicio"
          error={mostrarError("fechaInicio")}
          name="fechaInicio"
          onChange={(evento) =>
            cambiarCampo("fechaInicio", evento.target.value)
          }
          required
          type="date"
          value={valores.fechaInicio}
        />
        <Campo
          etiqueta="Fecha de fin"
          error={mostrarError("fechaFin")}
          min={valores.fechaInicio || undefined}
          name="fechaFin"
          onChange={(evento) => cambiarCampo("fechaFin", evento.target.value)}
          required
          type="date"
          value={valores.fechaFin}
        />
      </div>

      <Campo
        etiqueta="Presupuesto (COP)"
        error={mostrarError("presupuesto")}
        inputMode="numeric"
        min={PRESUPUESTO_MINIMO}
        name="presupuesto"
        onChange={(evento) => cambiarCampo("presupuesto", evento.target.value)}
        placeholder="Ej. 1500000"
        required
        step={1}
        type="number"
        value={valores.presupuesto}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Boton
          cargando={guardando}
          className="sm:min-w-40"
          disabled={!deviceId}
          type="submit"
        >
          {esEdicion ? "Actualizar viaje" : "Guardar y ver servicios"}
        </Boton>
        {esEdicion && (
          <Boton
            disabled={guardando}
            onClick={alCancelarEdicion}
            variante="secundario"
          >
            Cancelar
          </Boton>
        )}
      </div>
    </form>
  );
}
