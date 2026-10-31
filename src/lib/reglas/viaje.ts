import { DESTINO_MIN, PRESUPUESTO_MINIMO } from '@/lib/config/viajes';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esFechaValida, finNoAnteriorAInicio } from '@/lib/reglas/fechas';

export type EstadoViaje = 'Planeado' | 'Completado';

export type DatosValidacionViaje = {
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: number;
};

export function validarViaje(datos: DatosValidacionViaje): void {
  if (datos.destino.trim().length < DESTINO_MIN) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  if (!esFechaValida(datos.fechaInicio) || !esFechaValida(datos.fechaFin)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  if (!finNoAnteriorAInicio(datos.fechaInicio, datos.fechaFin)) {
    throw new ErrorDeNegocio('FECHA_FIN_ANTERIOR');
  }

  if (!Number.isInteger(datos.presupuesto) || datos.presupuesto < PRESUPUESTO_MINIMO) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}

export function alternarEstado(completado: boolean): boolean {
  return !completado;
}

export function etiquetaEstado(completado: boolean): EstadoViaje {
  return completado ? 'Completado' : 'Planeado';
}
