import { z } from "zod";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import {
  filtrarVuelosPorTipo,
  type Aeropuerto,
  type OpcionVuelo,
  type SegmentoVuelo,
  type TipoRutaVuelo,
} from "@/lib/reglas/vuelos";

const URL_PRODUCCION = "https://api.amadeus.com";
const URL_PRUEBAS = "https://test.api.amadeus.com";
const tiempoDeEsperaMs = 10_000;

const esquemaToken = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});

const esquemaRespuestaAeropuertos = z.object({
  data: z.array(
    z.object({
      subType: z.string(),
      iataCode: z.string().regex(/^[A-Z]{3}$/),
      name: z.string().trim().min(1),
      address: z.object({
        cityName: z.string().trim().min(1),
        countryName: z.string().trim().min(1),
        countryCode: z.string().regex(/^[A-Z]{2}$/),
      }),
    }),
  ),
});

const esquemaSegmentoProveedor = z.object({
  departure: z.object({
    iataCode: z.string().regex(/^[A-Z]{3}$/),
    at: z.iso.datetime(),
  }),
  arrival: z.object({
    iataCode: z.string().regex(/^[A-Z]{3}$/),
    at: z.iso.datetime(),
  }),
  carrierCode: z.string().regex(/^[A-Z0-9]{2,3}$/),
  number: z.string().min(1),
  duration: z.string().min(1),
});

const esquemaItinerarioProveedor = z.object({
  segments: z.array(esquemaSegmentoProveedor).min(1).max(10),
});

const esquemaRespuestaVuelos = z.object({
  data: z.array(
    z.object({
      id: z.string().min(1),
      itineraries: z.array(esquemaItinerarioProveedor).min(1).max(2),
      price: z.object({
        grandTotal: z.string().min(1),
        currency: z.string().regex(/^[A-Z]{3}$/),
      }),
    }),
  ),
  dictionaries: z
    .object({
      carriers: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

let tokenAlmacenado: { valor: string; vence: number } | null = null;
let solicitudToken: Promise<string> | null = null;

function obtenerConfiguracion() {
  const clienteId = process.env.AMADEUS_CLIENT_ID?.trim();
  const clienteSecreto = process.env.AMADEUS_CLIENT_SECRET?.trim();
  const url = (
    process.env.AMADEUS_API_BASE_URL?.trim() || URL_PRODUCCION
  ).replace(/\/+$/, "");

  if (!clienteId || !clienteSecreto) {
    throw new ErrorDeNegocio("AMADEUS_NO_CONFIGURADO");
  }

  if (url !== URL_PRODUCCION && url !== URL_PRUEBAS) {
    throw new ErrorDeNegocio(
      "AMADEUS_NO_CONFIGURADO",
      "La URL del proveedor de vuelos no es válida.",
    );
  }

  return { clienteId, clienteSecreto, url };
}

async function consultar(url: string, opciones: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...opciones,
      cache: "no-store",
      signal: AbortSignal.timeout(tiempoDeEsperaMs),
    });
  } catch (error) {
    console.error("No se pudo conectar con Amadeus.", error);
    throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
  }
}

async function leerRespuestaJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Amadeus devolvió una respuesta JSON inválida.");
      throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
    }

    throw error;
  }
}

async function solicitarToken(): Promise<string> {
  const { clienteId, clienteSecreto, url } = obtenerConfiguracion();
  const respuesta = await consultar(`${url}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clienteId,
      client_secret: clienteSecreto,
    }),
  });

  if (!respuesta.ok) {
    console.error("Amadeus rechazó la autenticación.", respuesta.status);
    throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
  }

  const resultado = esquemaToken.safeParse(await leerRespuestaJson(respuesta));
  if (!resultado.success) {
    console.error("Amadeus devolvió un token con formato inválido.");
    throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
  }

  tokenAlmacenado = {
    valor: resultado.data.access_token,
    vence: Date.now() + Math.max(30, resultado.data.expires_in - 60) * 1000,
  };
  return resultado.data.access_token;
}

async function obtenerToken(): Promise<string> {
  if (tokenAlmacenado && tokenAlmacenado.vence > Date.now()) {
    return tokenAlmacenado.valor;
  }

  if (!solicitudToken) {
    solicitudToken = solicitarToken().finally(() => {
      solicitudToken = null;
    });
  }

  return solicitudToken;
}

async function consultarAmadeus(
  ruta: string,
  parametros: URLSearchParams,
): Promise<unknown> {
  const { url } = obtenerConfiguracion();
  const token = await obtenerToken();
  const respuesta = await consultar(
    `${url}${ruta}?${parametros.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      method: "GET",
    },
  );

  if (!respuesta.ok) {
    console.error("Amadeus rechazó la consulta.", respuesta.status);
    throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
  }

  return leerRespuestaJson(respuesta);
}

export async function buscarAeropuertos(
  consulta: string,
  tipoRuta: TipoRutaVuelo,
): Promise<Aeropuerto[]> {
  const parametros = new URLSearchParams({
    keyword: consulta.trim(),
    subType: "AIRPORT",
    view: "FULL",
    sort: "analytics.travelers.score",
    "page[limit]": "10",
  });

  if (tipoRuta === "nacional") {
    parametros.set("countryCode", "CO");
  }

  const respuesta = esquemaRespuestaAeropuertos.safeParse(
    await consultarAmadeus("/v1/reference-data/locations", parametros),
  );

  if (!respuesta.success) {
    console.error("Amadeus devolvió aeropuertos con formato inválido.");
    throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
  }

  return respuesta.data.data
    .filter((ubicacion) => ubicacion.subType === "AIRPORT")
    .map((ubicacion) => ({
      codigo: ubicacion.iataCode,
      nombre: ubicacion.name,
      ciudad: ubicacion.address.cityName,
      pais: ubicacion.address.countryName,
      codigoPais: ubicacion.address.countryCode,
    }));
}

function mapearSegmento(
  segmento: z.infer<typeof esquemaSegmentoProveedor>,
  aerolineas: Record<string, string>,
): SegmentoVuelo {
  return {
    aerolinea: aerolineas[segmento.carrierCode] ?? segmento.carrierCode,
    codigoAerolinea: segmento.carrierCode,
    numeroVuelo: segmento.number,
    origenCodigo: segmento.departure.iataCode,
    destinoCodigo: segmento.arrival.iataCode,
    salida: segmento.departure.at,
    llegada: segmento.arrival.at,
    duracion: segmento.duration,
  };
}

export async function buscarVuelosAmadeus(datos: {
  origen: string;
  destino: string;
  fechaIda: string;
  fechaRegreso?: string | undefined;
  viajeros: number;
  tipoRuta: TipoRutaVuelo;
}): Promise<OpcionVuelo[]> {
  const parametros = new URLSearchParams({
    originLocationCode: datos.origen,
    destinationLocationCode: datos.destino,
    departureDate: datos.fechaIda,
    adults: String(datos.viajeros),
    currencyCode: "COP",
    max: "30",
  });

  if (datos.fechaRegreso) {
    parametros.set("returnDate", datos.fechaRegreso);
  }

  if (datos.tipoRuta === "nacional") {
    parametros.set("nonStop", "true");
  }

  const respuesta = esquemaRespuestaVuelos.safeParse(
    await consultarAmadeus("/v2/shopping/flight-offers", parametros),
  );

  if (!respuesta.success) {
    console.error("Amadeus devolvió ofertas de vuelos con formato inválido.");
    throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
  }

  const aerolineas = respuesta.data.dictionaries?.carriers ?? {};
  const consultadoEn = new Date().toISOString();
  const ofertas = respuesta.data.data.map((oferta): OpcionVuelo => {
    if (oferta.price.currency !== "COP") {
      throw new ErrorDeNegocio(
        "AMADEUS_NO_DISPONIBLE",
        "El proveedor no devolvió el precio en pesos colombianos.",
      );
    }

    const precio = Math.round(Number(oferta.price.grandTotal));
    if (!Number.isSafeInteger(precio) || precio < 1) {
      throw new ErrorDeNegocio("AMADEUS_NO_DISPONIBLE");
    }

    const segmentosIda = oferta.itineraries[0]!.segments.map((segmento) =>
      mapearSegmento(segmento, aerolineas),
    );
    const segmentosRegreso = (oferta.itineraries[1]?.segments ?? []).map(
      (segmento) => mapearSegmento(segmento, aerolineas),
    );

    return {
      id: oferta.id,
      tipoRuta: datos.tipoRuta,
      aerolinea:
        segmentosIda[0]?.aerolinea ??
        segmentosIda[0]?.codigoAerolinea ??
        "Aerolínea",
      segmentosIda,
      segmentosRegreso,
      escalasIda: segmentosIda.length - 1,
      escalasRegreso:
        segmentosRegreso.length > 0 ? segmentosRegreso.length - 1 : null,
      precio,
      moneda: "COP",
      consultadoEn,
    };
  });

  return filtrarVuelosPorTipo(ofertas, datos.tipoRuta)
    .sort((primero, segundo) => primero.precio - segundo.precio)
    .slice(0, 20);
}
