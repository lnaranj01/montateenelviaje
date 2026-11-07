export const identificadoresServiciosViaje = [
  "vuelo-economico",
  "vuelo-flexible",
  "hospedaje-sencillo",
  "hospedaje-central",
  "carro-compacto",
  "carro-familiar",
  "tour-cultural",
  "tour-aventura",
  "kit-esencial",
  "kit-completo",
] as const;

export type IdentificadorServicioViaje =
  (typeof identificadoresServiciosViaje)[number];
export type UnidadServicioViaje = "viajero" | "noche" | "dia";

export interface ServicioCatalogoViaje {
  id: IdentificadorServicioViaje;
  categoria: string;
  nombre: string;
  descripcion: string;
  proporcionPresupuestoDiario: number;
  unidad: UnidadServicioViaje;
  numeroEscalas?: 0 | 1;
}

export interface ServicioPlanViaje extends ServicioCatalogoViaje {
  precio: number;
}

export interface DatosCalculoPlanViaje {
  presupuesto: number;
  dias: number;
  noches: number;
  viajeros: number;
}

export const catalogoServiciosViaje: ServicioCatalogoViaje[] = [
  {
    id: "vuelo-economico",
    categoria: "Vuelos",
    nombre: "Vuelo nacional de muestra",
    descripcion: "Ejemplo de vuelo ida y vuelta por viajero.",
    proporcionPresupuestoDiario: 0.9,
    unidad: "viajero",
    numeroEscalas: 0,
  },
  {
    id: "vuelo-flexible",
    categoria: "Vuelos",
    nombre: "Vuelo flexible de muestra",
    descripcion: "Ejemplo de tarifa flexible por viajero.",
    proporcionPresupuestoDiario: 1.56,
    unidad: "viajero",
    numeroEscalas: 1,
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

const categoriasPorServicio = new Map(
  catalogoServiciosViaje.map((servicio) => [servicio.id, servicio.categoria]),
);

function unidadesPara(
  servicio: ServicioCatalogoViaje,
  datos: DatosCalculoPlanViaje,
): number {
  if (servicio.unidad === "noche") {
    return datos.noches;
  }

  if (servicio.unidad === "dia") {
    return datos.dias;
  }

  return datos.viajeros;
}

export function validarServiciosPlanViaje(
  identificadores: readonly IdentificadorServicioViaje[],
): boolean {
  const vistos = new Set<string>();
  const categorias = new Set<string>();

  for (const id of identificadores) {
    const categoria = categoriasPorServicio.get(id);
    if (!categoria || vistos.has(id) || categorias.has(categoria)) {
      return false;
    }

    vistos.add(id);
    categorias.add(categoria);
  }

  return identificadores.length > 0;
}

export function calcularServiciosPlanViaje(
  identificadores: readonly IdentificadorServicioViaje[],
  datos: DatosCalculoPlanViaje,
): ServicioPlanViaje[] {
  if (
    !Number.isSafeInteger(datos.presupuesto) ||
    datos.presupuesto < 1 ||
    !Number.isSafeInteger(datos.dias) ||
    datos.dias < 1 ||
    !Number.isSafeInteger(datos.noches) ||
    datos.noches < 0 ||
    !Number.isSafeInteger(datos.viajeros) ||
    datos.viajeros < 1 ||
    !validarServiciosPlanViaje(identificadores)
  ) {
    throw new RangeError("Los datos del plan de viaje no son válidos.");
  }

  return identificadores.map((id) => {
    const servicio = catalogoServiciosViaje.find(
      (candidato) => candidato.id === id,
    );

    if (!servicio) {
      throw new RangeError("El servicio seleccionado no existe.");
    }

    const presupuestoDiarioPorViajero =
      datos.presupuesto / datos.dias / datos.viajeros;
    const precioDiario =
      presupuestoDiarioPorViajero * servicio.proporcionPresupuestoDiario;
    const precioPorUnidad = Math.max(
      1_000,
      Math.round(precioDiario / 1_000) * 1_000,
    );
    const cantidadUnidades = unidadesPara(servicio, datos);
    const cantidadViajeros = servicio.unidad === "viajero" ? 1 : datos.viajeros;

    return {
      ...servicio,
      precio: precioPorUnidad * cantidadUnidades * cantidadViajeros,
    };
  });
}
