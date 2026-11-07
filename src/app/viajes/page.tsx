import { PaginaViajesCliente } from "@/components/viajes/PaginaViajesCliente";
import type { EstadoViaje } from "@/lib/reglas/viaje";

type ParametrosPagina = Record<string, string | string[] | undefined>;

interface PaginaViajesProps {
  searchParams: Promise<ParametrosPagina>;
}

function primerParametro(
  valor: string | string[] | undefined,
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PaginaViajes({
  searchParams,
}: PaginaViajesProps) {
  const parametros = await searchParams;
  const estadoParametro = primerParametro(parametros.estado);
  const ordenParametro = primerParametro(parametros.orden);
  const estado: EstadoViaje | "" =
    estadoParametro === "Planeado" || estadoParametro === "Completado"
      ? estadoParametro
      : "";
  const orden = ordenParametro === "inicio" ? "inicio" : "reciente";

  return <PaginaViajesCliente estado={estado} orden={orden} />;
}
