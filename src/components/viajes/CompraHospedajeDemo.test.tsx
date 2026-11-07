import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompraHospedajeDemo } from "@/components/viajes/CompraHospedajeDemo";

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

describe("CompraHospedajeDemo", () => {
  it("permite recorrer la búsqueda y revisión sin crear una reserva ni cobrar", () => {
    const fetchEspiado = vi.spyOn(globalThis, "fetch");
    render(<CompraHospedajeDemo />);

    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "Cartagena" },
    });
    fireEvent.change(screen.getByLabelText("Llegada"), {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByLabelText("Salida"), {
      target: { value: "2026-12-12" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Buscar opciones de muestra" })
        .closest("form")!,
    );

    expect(
      screen.getByRole("heading", { name: "Opciones ficticias en Cartagena" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Revisar ejemplo" })[0]!,
    );
    expect(
      screen.getByText("Total de ejemplo: $ 640.000 COP"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Probar confirmación (sin reservar)",
      }),
    );

    expect(
      screen.getByText(
        "Pudiste recorrer el prototipo. No se creó ninguna reserva, no se enviaron datos a un proveedor y no se realizó ningún cobro.",
      ),
    ).toBeInTheDocument();
    expect(fetchEspiado).not.toHaveBeenCalled();
    fetchEspiado.mockRestore();
  });

  it("rechaza fechas en las que la salida es anterior a la llegada", () => {
    render(<CompraHospedajeDemo />);

    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "Cartagena" },
    });
    fireEvent.change(screen.getByLabelText("Llegada"), {
      target: { value: "2026-12-12" },
    });
    fireEvent.change(screen.getByLabelText("Salida"), {
      target: { value: "2026-12-10" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Buscar opciones de muestra" })
        .closest("form")!,
    );

    expect(
      screen.getByText(
        "La fecha de salida no puede ser anterior a la de llegada.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Opciones ficticias en Cartagena",
      }),
    ).not.toBeInTheDocument();
  });
});
