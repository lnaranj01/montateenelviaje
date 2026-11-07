import type {
  IdentificadorServicioViaje,
  ServicioPlanViaje,
} from "@/lib/reglas/planViaje";
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
  estado?: EstadoViaje | undefined;
  orden?: "inicio" | "reciente" | undefined;
}

export interface DatosPlanGuardado {
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  presupuesto: number;
  viajeros: number;
  servicios: IdentificadorServicioViaje[];
}

export interface PlanGuardado extends Omit<DatosPlanGuardado, "servicios"> {
  id: string;
  servicios: ServicioPlanViaje[];
  total: number;
}
