import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanificadorViaje } from "@/components/viajes/PlanificadorViaje";
import { CLAVE_DATOS_INICIALES_PLANIFICADOR } from "@/lib/config/planificador";
import type { Aeropuerto, OpcionVuelo } from "@/lib/reglas/vuelos";

const navegacion = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navegacion,
}));

const aeropuertoBogota: Aeropuerto = {
  codigo: "BOG",
  nombre: "El Dorado International Airport",
  ciudad: "Bogotá",
  pais: "Colombia",
  codigoPais: "CO",
};

const aeropuertoCartagena: Aeropuerto = {
  codigo: "CTG",
  nombre: "Rafael Núñez International Airport",
  ciudad: "Cartagena",
  pais: "Colombia",
  codigoPais: "CO",
};

const aeropuertoMiami: Aeropuerto = {
  codigo: "MIA",
  nombre: "Miami International Airport",
  ciudad: "Miami",
  pais: "Estados Unidos",
  codigoPais: "US",
};

function segmento(
  origenCodigo: string,
  destinoCodigo: string,
  codigoAerolinea: string,
  numeroVuelo: string,
  horaSalida: string,
  horaLlegada: string,
) {
  return {
    aerolinea: "Avianca",
    codigoAerolinea,
    numeroVuelo,
    origenCodigo,
    destinoCodigo,
    salida: `2026-12-10T${horaSalida}:00Z`,
    llegada: `2026-12-10T${horaLlegada}:00Z`,
    duracion: "PT1H",
  };
}

const vueloNacional: OpcionVuelo = {
  id: "nacional-directo",
  tipoRuta: "nacional",
  aerolinea: "Avianca",
  segmentosIda: [segmento("BOG", "CTG", "AV", "123", "10:00", "11:00")],
  segmentosRegreso: [segmento("CTG", "BOG", "AV", "124", "12:00", "13:00")],
  escalasIda: 0,
  escalasRegreso: 0,
  precio: 600_000,
  moneda: "COP",
  consultadoEn: "2026-11-14T12:00:00Z",
};

const vueloInternacionalConEscala: OpcionVuelo = {
  id: "internacional-escala",
  tipoRuta: "internacional",
  aerolinea: "Avianca",
  segmentosIda: [
    segmento("BOG", "PTY", "AV", "200", "10:00", "12:00"),
    segmento("PTY", "MIA", "AV", "201", "13:00", "15:00"),
  ],
  segmentosRegreso: [segmento("MIA", "BOG", "AV", "202", "16:00", "19:00")],
  escalasIda: 1,
  escalasRegreso: 0,
  precio: 1_040_000,
  moneda: "COP",
  consultadoEn: "2026-11-14T12:00:00Z",
};

const vueloInternacionalDirecto: OpcionVuelo = {
  ...vueloNacional,
  id: "internacional-directo",
  tipoRuta: "internacional",
  segmentosIda: [segmento("BOG", "MIA", "AV", "300", "10:00", "14:00")],
  segmentosRegreso: [segmento("MIA", "BOG", "AV", "301", "15:00", "19:00")],
  escalasIda: 0,
  escalasRegreso: 0,
  precio: 1_452_000,
};

function respuestaJson(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fetchFalso = vi.fn(
  async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
    const url = new URL(
      typeof entrada === "string"
        ? entrada
        : entrada instanceof URL
          ? entrada.href
          : entrada.url,
      "http://localhost",
    );

    if (url.pathname === "/api/viajes/aeropuertos") {
      const consulta = url.searchParams.get("consulta")?.toLowerCase() ?? "";
      const aeropuertos = consulta.includes("bog")
        ? [aeropuertoBogota]
        : consulta.includes("cart")
          ? [aeropuertoCartagena]
          : consulta.includes("mia") || consulta.includes("miami")
            ? [aeropuertoMiami]
            : [];
      return respuestaJson({ ok: true, datos: { aeropuertos } });
    }

    if (url.pathname === "/api/viajes/vuelos") {
      const ofertas =
        url.searchParams.get("tipoRuta") === "internacional"
          ? [vueloInternacionalConEscala, vueloInternacionalDirecto]
          : [
              vueloNacional,
              {
                ...vueloNacional,
                id: "nacional-con-escala",
                tipoRuta: "internacional",
                segmentosIda: vueloInternacionalConEscala.segmentosIda,
                escalasIda: 1,
                precio: 400_000,
              },
            ];
      return respuestaJson({ ok: true, datos: { ofertas } });
    }

    if (
      url.pathname === "/api/viajes/planes" &&
      opciones?.method === "POST"
    ) {
      return respuestaJson({ ok: true, datos: { id: "plan-guardado" } }, 201);
    }

    throw new Error(`Solicitud inesperada: ${url.pathname}`);
  },
);

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchFalso);
});

async function seleccionarAeropuerto(
  etiqueta: string,
  consulta: string,
  codigo: string,
) {
  fireEvent.change(screen.getByLabelText(etiqueta), {
    target: { value: consulta },
  });
  fireEvent.click(await screen.findByRole("option", { name: new RegExp(codigo) }));
}

async function completarBusqueda(
  presupuesto: string,
  destino = "Cartagena",
  codigoDestino = "CTG",
  fechaIda = "2026-12-10",
  fechaRegreso = "2026-12-12",
) {
  await seleccionarAeropuerto("Ciudad y aeropuerto de salida", "Bogotá", "BOG");
  await seleccionarAeropuerto(
    "Ciudad y aeropuerto de llegada",
    destino,
    codigoDestino,
  );
  fireEvent.change(screen.getByLabelText("Fecha de ida"), {
    target: { value: fechaIda },
  });
  fireEvent.change(screen.getByLabelText("Fecha de regreso"), {
    target: { value: fechaRegreso },
  });
  fireEvent.change(screen.getByLabelText("Presupuesto total (COP)"), {
    target: { value: presupuesto },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Consultar vuelos" }).closest("form")!,
  );

  await waitFor(() =>
    expect(
      fetchFalso.mock.calls.some(([entrada]) =>
        String(entrada).includes("/api/viajes/vuelos?"),
      ),
    ).toBe(true),
  );
  await screen.findByRole("heading", {
    name: `Opciones de viaje para ${destino}`,
  });
}

describe("PlanificadorViaje", () => {
  it("consulta tarifas y suma el vuelo real al presupuesto", async () => {
    render(<PlanificadorViaje />);
    await completarBusqueda("2000000");

    expect(
      screen.getByText(
        /Llegada: Rafael Núñez International Airport \(CTG\) · Cartagena/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Elegir vuelo Avianca AV123/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Elegir vuelo Avianca AV200/,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Elegir vuelo Avianca AV123/,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Elegir Hospedaje esencial estimado" }),
    );

    expect(screen.getByLabelText("Total seleccionado")).toHaveTextContent(
      /1\.000\.000.*COP/,
    );
    expect(fetchFalso).toHaveBeenCalledWith(
      expect.stringContaining("/api/viajes/vuelos?"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("no presenta vuelos nacionales con escalas aunque el servidor los devuelva", async () => {
    render(<PlanificadorViaje />);
    await completarBusqueda("2000000");

    expect(
      screen.getByRole("button", {
        name: /Elegir vuelo Avianca AV123/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Elegir vuelo Avianca AV200/,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/1 escalas/)).not.toBeInTheDocument();
  });

  it("muestra la aerolínea y las escalas reales de una ruta internacional", async () => {
    render(<PlanificadorViaje />);
    fireEvent.change(screen.getByLabelText("Tipo de ruta"), {
      target: { value: "internacional" },
    });
    await completarBusqueda("2000000", "Miami", "MIA");

    expect(
      screen.getByRole("button", {
        name: /Elegir vuelo Avianca AV200 · AV201/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ida: AV200 · AV201 · 1 escalas/)).toBeInTheDocument();
    expect(
      screen.getByText(/Llegada: Miami International Airport \(MIA\) · Miami/),
    ).toBeInTheDocument();
  });

  it("bloquea la consulta si no se selecciona un aeropuerto de llegada", async () => {
    render(<PlanificadorViaje />);
    await seleccionarAeropuerto("Ciudad y aeropuerto de salida", "Bogotá", "BOG");
    fireEvent.submit(
      screen.getByRole("button", { name: "Consultar vuelos" }).closest("form")!,
    );

    expect(
      screen.getByText("Selecciona el aeropuerto de llegada de la lista."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Opciones de viaje/ }),
    ).not.toBeInTheDocument();
  });

  it("rechaza fechas en las que el regreso es anterior a la ida", async () => {
    render(<PlanificadorViaje />);
    await seleccionarAeropuerto("Ciudad y aeropuerto de salida", "Bogotá", "BOG");
    await seleccionarAeropuerto(
      "Ciudad y aeropuerto de llegada",
      "Cartagena",
      "CTG",
    );
    fireEvent.change(screen.getByLabelText("Fecha de ida"), {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de regreso"), {
      target: { value: "2026-12-09" },
    });
    fireEvent.change(screen.getByLabelText("Presupuesto total (COP)"), {
      target: { value: "2000000" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Consultar vuelos" }).closest("form")!,
    );

    expect(
      screen.getByText(
        "La fecha de regreso no puede ser anterior a la fecha de ida.",
      ),
    ).toBeInTheDocument();
    expect(
      fetchFalso.mock.calls.some(([entrada]) =>
        String(entrada).includes("/api/viajes/vuelos?"),
      ),
    ).toBe(false);
  });

  it("guarda el vuelo consultado junto con la selección del plan", async () => {
    render(<PlanificadorViaje />);
    await completarBusqueda("2000000");
    fireEvent.click(
      screen.getByRole("button", {
        name: /Elegir vuelo Avianca AV123/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Revisar mi plan" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar en mis viajes" }),
    );

    await waitFor(() => {
      expect(navegacion.push).toHaveBeenCalledWith("/viajes?planGuardado=1");
    });

    const solicitudGuardar = fetchFalso.mock.calls.find(
      ([entrada, opciones]) =>
        new URL(
          typeof entrada === "string"
            ? entrada
            : entrada instanceof URL
              ? entrada.href
              : entrada.url,
          "http://localhost",
        ).pathname === "/api/viajes/planes" &&
        opciones?.method === "POST",
    );
    expect(solicitudGuardar).toBeDefined();
    const cuerpo = JSON.parse(String(solicitudGuardar?.[1]?.body)) as {
      origen: string;
      destino: string;
      servicios: string[];
      vuelo: OpcionVuelo;
    };
    expect(cuerpo.origen).toContain("BOG");
    expect(cuerpo.destino).toContain("Rafael Núñez International Airport (CTG)");
    expect(cuerpo.servicios).toEqual([]);
    expect(cuerpo.vuelo.id).toBe(vueloNacional.id);
  });

  it("vuelve a abrir un plan y conserva la tarifa consultada", async () => {
    sessionStorage.setItem(
      CLAVE_DATOS_INICIALES_PLANIFICADOR,
      JSON.stringify({
        origen: "Bogotá — El Dorado International Airport (BOG)",
        destino:
          "Cartagena · Aeropuerto: Rafael Núñez International Airport (CTG)",
        fechaInicio: "2026-12-10",
        fechaFin: "2026-12-12",
        presupuesto: 2_000_000,
        viajeros: 2,
        servicios: [],
        vuelo: vueloNacional,
      }),
    );

    render(<PlanificadorViaje />);

    expect(
      await screen.findByRole("heading", {
        name: "Opciones de viaje para Cartagena",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Quitar vuelo Avianca AV123/,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("$ 600.000 COP")).toBeInTheDocument();
  });
});
