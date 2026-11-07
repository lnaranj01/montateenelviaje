import { render, screen } from "@testing-library/react";
import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanesGuardados } from "@/components/viajes/PlanesGuardados";

const navegacion = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@/lib/hooks/useDeviceId", () => ({
  useDeviceId: () => "00000000-0000-4000-8000-000000000001",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navegacion,
}));

const plan = {
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
};

function respuestaPlanes(planes = [plan]) {
  return new Response(JSON.stringify({ ok: true, datos: { planes } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("PlanesGuardados", () => {
  it("muestra en el inicio los servicios guardados, el total y que son un plan", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respuestaPlanes());

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
    expect(
      screen.getByRole("button", { name: "Volver a entrar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eliminar plan de Cartagena" }),
    ).toBeInTheDocument();
  });

  it("reabre un plan guardado con sus datos y servicios seleccionados", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respuestaPlanes());

    render(<PlanesGuardados />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Volver a entrar" }),
    );

    expect(navegacion.push).toHaveBeenCalledWith("/demo-compras");
    expect(
      JSON.parse(
        sessionStorage.getItem("organizador-planificador-datos-iniciales") ??
          "null",
      ),
    ).toEqual({
      origen: "Bogotá",
      destino: "Cartagena",
      fechaInicio: "2026-12-10",
      fechaFin: "2026-12-12",
      presupuesto: 2_000_000,
      viajeros: 2,
      servicios: ["vuelo-economico"],
    });
  });

  it("elimina un plan solo después de confirmar", async () => {
    const fetchSimulado = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(respuestaPlanes())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, datos: { eliminado: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    render(<PlanesGuardados />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Eliminar plan de Cartagena",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Eliminar plan guardado" }),
    ).toBeInTheDocument();
    expect(fetchSimulado).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar eliminación" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Se eliminó el plan para Cartagena."),
      ).toBeInTheDocument();
    });
    expect(fetchSimulado).toHaveBeenLastCalledWith(
      `/api/viajes/planes/${plan.id}`,
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          deviceId: "00000000-0000-4000-8000-000000000001",
        }),
      }),
    );
    expect(
      screen.getByText("Todavía no has guardado planes."),
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
