import type { EstadoViaje } from "@/lib/reglas/viaje";
import { Insignia } from "@/components/ui/Insignia";

interface InsigniaEstadoProps {
  estado: EstadoViaje;
}

export function InsigniaEstado({ estado }: InsigniaEstadoProps) {
  return (
    <Insignia tono={estado === "Completado" ? "completado" : "planeado"}>
      {estado}
    </Insignia>
  );
}
