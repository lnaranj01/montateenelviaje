export type TipoRutaVuelo = "nacional" | "internacional";

export interface Aeropuerto {
  codigo: string;
  nombre: string;
  ciudad: string;
  pais: string;
  codigoPais: string;
}

export interface SegmentoVuelo {
  aerolinea: string;
  codigoAerolinea: string;
  numeroVuelo: string;
  origenCodigo: string;
  destinoCodigo: string;
  salida: string;
  llegada: string;
  duracion: string;
}

export interface OpcionVuelo {
  id: string;
  tipoRuta: TipoRutaVuelo;
  aerolinea: string;
  segmentosIda: SegmentoVuelo[];
  segmentosRegreso: SegmentoVuelo[];
  escalasIda: number;
  escalasRegreso: number | null;
  precio: number;
  moneda: "COP";
  consultadoEn: string;
}

export function filtrarVuelosPorTipo(
  ofertas: readonly OpcionVuelo[],
  tipoRuta: TipoRutaVuelo,
): OpcionVuelo[] {
  if (tipoRuta === "internacional") {
    return [...ofertas];
  }

  return ofertas.filter(
    (oferta) =>
      oferta.segmentosIda.length === 1 &&
      (oferta.segmentosRegreso.length === 0 ||
        oferta.segmentosRegreso.length === 1),
  );
}
