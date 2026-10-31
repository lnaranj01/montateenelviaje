import { Boton } from "@/components/ui/Boton";
import { InsigniaEstado } from "@/components/viajes/InsigniaEstado";
import { Tarjeta } from "@/components/ui/Tarjeta";
import {
  formatearDuracion,
  formatearFecha,
  formatearPesos,
} from "@/lib/formato";
import type { Viaje } from "@/lib/datos/tipos";

interface TarjetaViajeProps {
  viaje: Viaje;
}

export function TarjetaViaje({ viaje }: TarjetaViajeProps) {
  return (
    <Tarjeta
      className={`flex h-full flex-col ${viaje.completado ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold leading-snug text-texto">
            {viaje.destino}
          </h3>
          <p className="mt-1 text-sm text-texto-suave">
            {formatearDuracion(viaje.duracionDias)}
          </p>
        </div>
        <InsigniaEstado estado={viaje.estado} />
      </div>

      <dl className="mt-5 grid flex-1 gap-4 border-t border-borde pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Fechas
          </dt>
          <dd className="mt-1 text-sm font-medium text-texto">
            {formatearFecha(viaje.fechaInicio)} –{" "}
            {formatearFecha(viaje.fechaFin)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Presupuesto
          </dt>
          <dd className="mt-1 text-base font-bold text-primario">
            {formatearPesos(viaje.presupuesto)}
          </dd>
        </div>
      </dl>

      <div
        aria-label={`Acciones para ${viaje.destino}`}
        className="mt-5 grid grid-cols-3 gap-2 border-t border-borde pt-4"
      >
        <Boton
          aria-label={`${viaje.completado ? "Reactivar" : "Completar"} ${viaje.destino} (próximamente)`}
          className="px-2 text-xs"
          disabled
          title="Disponible próximamente"
          variante="secundario"
        >
          {viaje.completado ? "Reactivar" : "Completar"}
        </Boton>
        <Boton
          aria-label={`Editar ${viaje.destino} (próximamente)`}
          className="px-2 text-xs"
          disabled
          title="Disponible próximamente"
          variante="secundario"
        >
          Editar
        </Boton>
        <Boton
          aria-label={`Eliminar ${viaje.destino} (próximamente)`}
          className="px-2 text-xs"
          disabled
          title="Disponible próximamente"
          variante="peligro"
        >
          Eliminar
        </Boton>
      </div>
    </Tarjeta>
  );
}
