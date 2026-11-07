import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanesGuardados } from "@/components/viajes/PlanesGuardados";

vi.mock("@/lib/hooks/useDeviceId", () => ({
  useDeviceId: () => "00000000-0000-4000-8000-000000000001",
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PlanesGuardados", () => {
  it("muestra en el inicio los servicios guardados, el total y que son un plan", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          datos: {
            planes: [
              {
                id: "00000000-0000-4000-8000-000000000010",
                origen: "Bogotá",
                destino: "Cartagena",
                fechaInicio: "2026-12-10",
                fechaFin: "2026-12-12",
                presupuesto: 2_000_000,
                viajeros: 2,
                total: 1_580_000,
                servicios: [
                  {
                    id: "vuelo-economico",
                    categoria: "Vuelos",
                    nombre: "Vuelo nacional de muestra",
                    descripcion: "Ejemplo de vuelo.",
                    proporcionPresupuestoDiario: 0.9,
                    unidad: "viajero",
                    numeroEscalas: 1,
                    precio: 600_000,
                  },
                ],
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<PlanesGuardados />);

    expect(await screen.findByText("Bogotá → Cartagena")).toBeInTheDocument();
    expect(screen.getByText("Plan guardado · no comprado")).toBeInTheDocument();
    expect(screen.getByText("Vuelo nacional de muestra")).toBeInTheDocument();
    expect(
      screen.getByText("Vuelo con 1 escala de ejemplo"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Total de ejemplo:.*1\.580\.000/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No hay reserva, compra ni cobro asociado/),
    ).toBeInTheDocument();
  });

  it("permite reintentar si falla la carga de planes guardados", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network"));

    render(<PlanesGuardados />);

    expect(
      await screen.findByText(
        "No se pudo conectar para cargar los planes guardados.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Volver a intentar" }),
    ).toBeInTheDocument();
  });
});
