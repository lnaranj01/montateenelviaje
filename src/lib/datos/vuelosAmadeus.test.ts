import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function respuestaJson(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("integración de vuelos con Amadeus", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("AMADEUS_CLIENT_ID", "cliente-prueba");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "secreto-prueba");
    vi.stubEnv("AMADEUS_API_BASE_URL", "https://api.amadeus.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("limita aeropuertos nacionales a Colombia", async () => {
    const fetchFalso = vi
      .fn()
      .mockResolvedValueOnce(
        respuestaJson({ access_token: "token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        respuestaJson({
          data: [
            {
              subType: "AIRPORT",
              iataCode: "CTG",
              name: "Rafael Núñez International Airport",
              address: {
                cityName: "Cartagena",
                countryName: "Colombia",
                countryCode: "CO",
              },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchFalso);

    const { buscarAeropuertos } = await import("@/lib/datos/vuelosAmadeus");
    const aeropuertos = await buscarAeropuertos("Cartagena", "nacional");

    expect(aeropuertos).toEqual([
      {
        codigo: "CTG",
        nombre: "Rafael Núñez International Airport",
        ciudad: "Cartagena",
        pais: "Colombia",
        codigoPais: "CO",
      },
    ]);
    expect(String(fetchFalso.mock.calls[1]?.[0])).toContain(
      "countryCode=CO",
    );
    expect(String(fetchFalso.mock.calls[1]?.[0])).toContain(
      "subType=AIRPORT",
    );
  });

  it("solicita y filtra vuelos nacionales sin escalas en pesos", async () => {
    const segmento = {
      departure: { iataCode: "BOG", at: "2026-12-10T10:00:00Z" },
      arrival: { iataCode: "CTG", at: "2026-12-10T11:00:00Z" },
      carrierCode: "XX",
      number: "100",
      duration: "PT1H",
    };
    const fetchFalso = vi
      .fn()
      .mockResolvedValueOnce(
        respuestaJson({ access_token: "token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        respuestaJson({
          data: [
            {
              id: "directo",
              itineraries: [{ segments: [segmento] }],
              price: { grandTotal: "500000", currency: "COP" },
            },
            {
              id: "con-escala",
              itineraries: [
                {
                  segments: [
                    segmento,
                    {
                      ...segmento,
                      departure: {
                        iataCode: "CTG",
                        at: "2026-12-10T12:00:00Z",
                      },
                      arrival: {
                        iataCode: "SMR",
                        at: "2026-12-10T13:00:00Z",
                      },
                    },
                  ],
                },
              ],
              price: { grandTotal: "400000", currency: "COP" },
            },
          ],
          dictionaries: { carriers: { XX: "Aerolínea" } },
        }),
      );
    vi.stubGlobal("fetch", fetchFalso);

    const { buscarVuelosAmadeus } = await import(
      "@/lib/datos/vuelosAmadeus"
    );
    const ofertas = await buscarVuelosAmadeus({
      origen: "BOG",
      destino: "CTG",
      fechaIda: "2026-12-10",
      fechaRegreso: "2026-12-12",
      viajeros: 2,
      tipoRuta: "nacional",
    });

    expect(ofertas).toHaveLength(1);
    expect(ofertas[0]).toMatchObject({
      id: "directo",
      aerolinea: "Aerolínea",
      escalasIda: 0,
      precio: 500_000,
      moneda: "COP",
    });
    const consulta = String(fetchFalso.mock.calls[1]?.[0]);
    expect(consulta).toContain("nonStop=true");
    expect(consulta).toContain("currencyCode=COP");
  });

  it("rechaza la consulta si faltan las credenciales privadas", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");

    const { buscarAeropuertos } = await import("@/lib/datos/vuelosAmadeus");

    await expect(buscarAeropuertos("Cartagena", "nacional")).rejects.toMatchObject(
      { codigo: "AMADEUS_NO_CONFIGURADO" },
    );
  });

  it("devuelve vuelos ilustrativos si faltan las credenciales privadas", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "");

    const { buscarVuelosAmadeus } = await import(
      "@/lib/datos/vuelosAmadeus"
    );
    const ofertas = await buscarVuelosAmadeus({
      origen: "SMR",
      destino: "CTG",
      fechaIda: "2026-12-10",
      fechaRegreso: "2026-12-12",
      viajeros: 2,
      tipoRuta: "nacional",
    });

    expect(ofertas).toHaveLength(1);
    expect(ofertas[0]).toMatchObject({
      id: "ejemplo-nacional-directo",
      tipoRuta: "nacional",
      escalasIda: 0,
      precio: 600_000,
      moneda: "COP",
    });
  });
});
