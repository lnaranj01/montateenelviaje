import type { EstadoViaje } from "@/lib/reglas/viaje";

export interface Viaje {
  id: string;
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: number;
  completado: boolean;
  estado: EstadoViaje;
  duracionDias: number;
}

export interface DatosViaje {
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: number;
}

export interface ResumenViajes {
  total: number;
  planeados: number;
  completados: number;
  presupuestoTotal: number;
}

export interface FiltrosListadoViajes {
  estado?: EstadoViaje;
  orden?: "inicio" | "reciente";
}
