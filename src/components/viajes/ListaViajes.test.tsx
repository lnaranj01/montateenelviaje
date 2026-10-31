import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListaViajes } from "@/components/viajes/ListaViajes";
import { useDeviceId } from "@/lib/hooks/useDeviceId";

vi.mock("@/lib/hooks/useDeviceId", () => ({
  useDeviceId: vi.fn(),
}));

describe("ListaViajes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("muestra el contador y el mensaje acordado cuando no hay viajes", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ ok: true, datos: { viajes: [], total: 0 } }),
            { status: 200 },
          ),
        ),
    );

    render(<ListaViajes />);

    expect(await screen.findByText("Tienes 0 viajes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aún no has registrado viajes. Completa el formulario de arriba para agregar el primero.",
      ),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/viajes?deviceId=device-test",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("muestra los datos y las acciones deshabilitadas hasta P07", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            datos: {
              viajes: [
                {
                  id: "viaje-test",
                  destino: "Cartagena",
                  fechaInicio: "2026-12-10",
                  fechaFin: "2026-12-12",
                  presupuesto: 500000,
                  completado: false,
                  estado: "Planeado",
                  duracionDias: 3,
                },
              ],
              total: 1,
            },
          }),
          { status: 200 },
        ),
      ),
    );

    render(<ListaViajes />);

    expect(
      await screen.findByRole("heading", { name: "Cartagena" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tienes 1 viaje")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Completar Cartagena (próximamente)",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Eliminar Cartagena (próximamente)",
      }),
    ).toBeDisabled();
  });

  it("informa el error de API y permite reintentar", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: { mensaje: "No se pudieron cargar los viajes." },
            }),
            { status: 500 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ ok: true, datos: { viajes: [], total: 0 } }),
            { status: 200 },
          ),
        ),
    );

    render(<ListaViajes />);

    expect(
      await screen.findByText("No se pudieron cargar los viajes."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));

    expect(await screen.findByText("Tienes 0 viajes")).toBeInTheDocument();
  });
});
