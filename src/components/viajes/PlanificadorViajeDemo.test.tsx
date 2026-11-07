import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanificadorViajeDemo } from "@/components/viajes/PlanificadorViajeDemo";

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

afterEach(() => {
  vi.restoreAllMocks();
});

function completarBusqueda(presupuesto: string) {
  fireEvent.change(screen.getByLabelText("Destino"), {
    target: { value: "Cartagena" },
  });
  fireEvent.change(screen.getByLabelText("Fecha de llegada"), {
    target: { value: "2026-12-10" },
  });
  fireEvent.change(screen.getByLabelText("Fecha de salida"), {
    target: { value: "2026-12-12" },
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

  it("rechaza fechas en las que la salida es anterior a la llegada", () => {
    render(<PlanificadorViajeDemo />);
    fireEvent.change(screen.getByLabelText("Destino"), {
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
