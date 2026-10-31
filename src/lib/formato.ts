const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatearPesos(valor: number): string {
  return formatoPesos.format(valor);
}

export function formatearFecha(fecha: string): string {
  const valor = new Date(`${fecha}T00:00:00.000Z`);

  if (Number.isNaN(valor.getTime())) {
    throw new RangeError(
      "La fecha debe ser válida y usar el formato YYYY-MM-DD.",
    );
  }

  return formatoFecha.format(valor);
}

export function formatearDuracion(dias: number): string {
  return `${dias} ${dias === 1 ? "día" : "días"}`;
}
