import { describe, expect, it } from "vitest";
import {
  filtrarVuelosPorTipo,
  type OpcionVuelo,
} from "@/lib/reglas/vuelos";

const oferta: OpcionVuelo = {
  id: "1",
  tipoRuta: "nacional",
  aerolinea: "Aerolínea",
  segmentosIda: [
    {
      aerolinea: "Aerolínea",
      codigoAerolinea: "XX",
      numeroVuelo: "100",
      origenCodigo: "BOG",
      destinoCodigo: "CTG",
      salida: "2026-12-10T10:00:00Z",
      llegada: "2026-12-10T11:00:00Z",
      duracion: "PT1H",
    },
  ],
  segmentosRegreso: [],
  escalasIda: 0,
  escalasRegreso: null,
  precio: 500_000,
  moneda: "COP",
  consultadoEn: "2026-11-14T12:00:00Z",
};

describe("filtrarVuelosPorTipo", () => {
  it("descarta vuelos nacionales con conexión en ida o regreso", () => {
    const conEscala: OpcionVuelo = {
      ...oferta,
      id: "2",
      segmentosIda: [
        ...oferta.segmentosIda,
        {
          ...oferta.segmentosIda[0]!,
          origenCodigo: "CTG",
          destinoCodigo: "SMR",
        },
      ],
      escalasIda: 1,
    };

    expect(
      filtrarVuelosPorTipo([oferta, conEscala], "nacional").map(
        (vuelo) => vuelo.id,
      ),
    ).toEqual(["1"]);
  });

  it("conserva los vuelos con escalas para rutas internacionales", () => {
    const internacional = { ...oferta, tipoRuta: "internacional" as const };

    expect(
      filtrarVuelosPorTipo([internacional], "internacional"),
    ).toEqual([internacional]);
  });
});
