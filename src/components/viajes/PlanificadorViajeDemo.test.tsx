import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanificadorViajeDemo } from "@/components/viajes/PlanificadorViajeDemo";
import { CLAVE_DATOS_INICIALES_PLANIFICADOR } from "@/lib/config/planificador";

const navegacion = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navegacion,
}));

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

function completarBusqueda(
  presupuesto: string,
  fechaLlegada = "2026-12-10",
  fechaSalida = "2026-12-12",
) {
  fireEvent.change(screen.getByLabelText("Ciudad o aeropuerto de origen"), {
    target: { value: "Bogotá" },
  });
  fireEvent.change(screen.getByLabelText("Ciudad o aeropuerto de destino"), {
    target: { value: "Cartagena" },
  });
  fireEvent.change(screen.getByLabelText("Fecha de llegada"), {
    target: { value: fechaLlegada },
  });
  fireEvent.change(screen.getByLabelText("Fecha de salida"), {
    target: { value: fechaSalida },
  });
  fireEvent.change(screen.getByLabelText("Presupuesto total (COP)"), {
    target: { value: presupuesto },
  });
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Ver mis opciones de viaje" })
      .closest("form")!,
  );
}

describe("PlanificadorViajeDemo", () => {
  it("estima todas las categorías con el presupuesto y termina sin comprar", () => {
    const fetchEspiado = vi.spyOn(globalThis, "fetch");
    render(<PlanificadorViajeDemo />);
    completarBusqueda("2000000");

    expect(
      screen.getByRole("heading", {
        name: "Servicios de ejemplo para Cartagena",
      }),
    ).toBeInTheDocument();

    [
      "Vuelo nacional de muestra",
      "Hospedaje de muestra",
      "Carro compacto de muestra",
      "Tour cultural de muestra",
      "Kit de viaje de muestra",
    ].forEach((servicio) => {
      fireEvent.click(
        screen.getByRole("button", { name: `Elegir ${servicio}` }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Revisar mi plan" }));
    expect(screen.getByText(/^Total:/)).toHaveTextContent(/1\.580\.000.*COP/);
    expect(screen.getByText(/Quedarían/)).toHaveTextContent(/420\.000.*COP/);

    fireEvent.click(
      screen.getByRole("button", { name: "Terminar simulación" }),
    );
    expect(
      screen.getByText(/No se compraron servicios, no se crearon reservas/),
    ).toBeInTheDocument();
    expect(fetchEspiado).not.toHaveBeenCalled();
  });

  it("avisa cuando los servicios elegidos superan el presupuesto", () => {
    render(<PlanificadorViajeDemo />);
    completarBusqueda("1000000");
    fireEvent.click(
      screen.getByRole("button", { name: "Elegir Vuelo flexible de muestra" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Elegir Hospedaje central de muestra",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Elegir Carro familiar de muestra" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Elegir Tour de aventura de muestra",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Elegir Kit completo de muestra" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Revisar mi plan" }));

    expect(screen.getByText(/^Total:/)).toHaveTextContent(/1\.398\.000.*COP/);
    expect(screen.getByText(/Excede el presupuesto por/)).toHaveTextContent(
      /398\.000.*COP/,
    );
  });

  it("ajusta los precios de muestra a un presupuesto de 50 millones", () => {
    render(<PlanificadorViajeDemo />);
    completarBusqueda("50000000");

    fireEvent.click(
      screen.getByRole("button", { name: "Elegir Vuelo nacional de muestra" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Elegir Hospedaje de muestra" }),
    );

    expect(screen.getByText("$ 15.000.000 COP")).toBeInTheDocument();
    expect(screen.getByText("$ 10.000.000 COP")).toBeInTheDocument();
    expect(screen.getByLabelText("Total seleccionado")).toHaveTextContent(
      /25\.000\.000.*COP/,
    );
  });

  it("muestra precios para todas las opciones y rutas de vuelo con escalas", () => {
    render(<PlanificadorViajeDemo />);
    completarBusqueda("2000000");

    expect(screen.getByText("$ 600.000 COP")).toBeInTheDocument();
    expect(screen.getByText("$ 1.040.000 COP")).toBeInTheDocument();
    expect(screen.queryByText("$ 0 COP")).not.toBeInTheDocument();
    expect(screen.getAllByText("Bogotá").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cartagena").length).toBeGreaterThan(0);
    expect(screen.getByText("Directo (ejemplo)")).toBeInTheDocument();
    expect(
      screen.getByText("1 escala (ejemplo; ciudad no confirmada)"),
    ).toBeInTheDocument();
  });

  it("muestra precios distintos de cero para el viaje reportado", () => {
    render(<PlanificadorViajeDemo />);
    completarBusqueda("5000000", "2026-11-08", "2026-11-30");

    [
      "$ 196.000 COP",
      "$ 340.000 COP",
      "$ 1.452.000 COP",
      "$ 2.288.000 COP",
      "$ 920.000 COP",
      "$ 1.564.000 COP",
      "$ 42.000 COP",
      "$ 84.000 COP",
      "$ 30.000 COP",
      "$ 72.000 COP",
    ].forEach((precio) => {
      expect(screen.getByText(precio)).toBeInTheDocument();
    });
  });

  it("pide la ciudad de salida con los datos del viaje precargados", async () => {
    sessionStorage.setItem(
      CLAVE_DATOS_INICIALES_PLANIFICADOR,
      JSON.stringify({
        destino: "Cartagena",
        fechaInicio: "2026-12-10",
        fechaFin: "2026-12-12",
        presupuesto: 2000000,
      }),
    );

    render(<PlanificadorViajeDemo />);

    expect(
      await screen.findByText(/Indica desde qué ciudad sales/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Ciudad o aeropuerto de origen")).toHaveValue(
      "",
    );
    expect(screen.getByLabelText("Ciudad o aeropuerto de destino")).toHaveValue(
      "Cartagena",
    );
    expect(screen.getByLabelText("Fecha de llegada")).toHaveValue("2026-12-10");
    expect(screen.getByLabelText("Fecha de salida")).toHaveValue("2026-12-12");
    expect(screen.getByLabelText("Presupuesto total (COP)")).toHaveValue(
      2000000,
    );
    expect(
      sessionStorage.getItem(CLAVE_DATOS_INICIALES_PLANIFICADOR),
    ).toBeNull();

    fireEvent.change(screen.getByLabelText("Ciudad o aeropuerto de origen"), {
      target: { value: "Bogotá" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Ver mis opciones de viaje" }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Servicios de ejemplo para Cartagena",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("$ 600.000 COP")).toBeInTheDocument();
    expect(screen.getAllByText("Bogotá").length).toBeGreaterThan(0);
  });

  it("vuelve a abrir un plan guardado con sus servicios seleccionados", async () => {
    sessionStorage.setItem(
      CLAVE_DATOS_INICIALES_PLANIFICADOR,
      JSON.stringify({
        origen: "Bogotá",
        destino: "Cartagena",
        fechaInicio: "2026-12-10",
        fechaFin: "2026-12-12",
        presupuesto: 2_000_000,
        viajeros: 2,
        servicios: ["vuelo-economico"],
      }),
    );

    render(<PlanificadorViajeDemo />);

    expect(
      await screen.findByRole("heading", {
        name: "Servicios de ejemplo para Cartagena",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Quitar Vuelo nacional de muestra",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("$ 600.000 COP")).toBeInTheDocument();
    expect(screen.getAllByText(/Bogotá/).length).toBeGreaterThan(0);
  });

  it("guarda los servicios elegidos para mostrarlos en mis viajes", async () => {
    const fetchEspiado = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, datos: { id: "plan-guardado" } }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    render(<PlanificadorViajeDemo />);
    completarBusqueda("2000000");
    fireEvent.click(
      screen.getByRole("button", { name: "Elegir Vuelo nacional de muestra" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Revisar mi plan" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar en mis viajes" }),
    );

    await waitFor(() => {
      expect(navegacion.push).toHaveBeenCalledWith("/viajes?planGuardado=1");
    });
    expect(fetchEspiado).toHaveBeenCalledWith(
      "/api/viajes/planes",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"servicios":["vuelo-economico"]'),
      }),
    );
    expect(fetchEspiado.mock.calls[0]?.[1]?.body).toContain(
      '"origen":"Bogotá"',
    );
  });

  it("rechaza fechas en las que la salida es anterior a la llegada", () => {
    render(<PlanificadorViajeDemo />);
    fireEvent.change(screen.getByLabelText("Ciudad o aeropuerto de origen"), {
      target: { value: "Bogotá" },
    });
    fireEvent.change(screen.getByLabelText("Ciudad o aeropuerto de destino"), {
      target: { value: "Cartagena" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de llegada"), {
      target: { value: "2026-12-12" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de salida"), {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByLabelText("Presupuesto total (COP)"), {
      target: { value: "1000000" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Ver mis opciones de viaje" })
        .closest("form")!,
    );

    expect(
      screen.getByText(
        "La fecha de salida no puede ser anterior a la de llegada.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Servicios de ejemplo para Cartagena",
      }),
    ).not.toBeInTheDocument();
  });
});
