const MILISEGUNDOS_POR_DIA = 86_400_000;
const DIAS_EN_CICLO_GREGORIANO = 146_097;

export function esFechaValida(fecha: string): boolean {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!coincidencia) {
    return false;
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);

  if (mes < 1 || mes > 12 || dia < 1) {
    return false;
  }

  const esBisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasPorMes = [
    31,
    esBisiesto ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maximoDias = diasPorMes[mes - 1];
  return maximoDias !== undefined && dia <= maximoDias;
}

export function finNoAnteriorAInicio(inicio: string, fin: string): boolean {
  return fin >= inicio;
}

function milisegundosUTC(fecha: string): number {
  const partes = fecha.split('-');
  const anio = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);

  if (anio < 100) {
    return Date.UTC(anio + 400, mes - 1, dia) - DIAS_EN_CICLO_GREGORIANO * MILISEGUNDOS_POR_DIA;
  }

  return Date.UTC(anio, mes - 1, dia);
}

export function duracionDias(inicio: string, fin: string): number {
  const diferencia = milisegundosUTC(fin) - milisegundosUTC(inicio);
  return Math.floor(diferencia / MILISEGUNDOS_POR_DIA) + 1;
}
