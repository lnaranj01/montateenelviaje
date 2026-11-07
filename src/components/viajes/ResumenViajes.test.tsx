import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResumenViajes } from "@/components/viajes/ResumenViajes";
import { useDeviceId } from "@/lib/hooks/useDeviceId";

vi.mock("@/lib/hooks/useDeviceId", () => ({
  useDeviceId: vi.fn(),
}));

describe("ResumenViajes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("muestra conteos y presupuesto del resumen del dispositivo", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            datos: {
              total: 3,
              planeados: 2,
              completados: 1,
              presupuestoTotal: 2_500_000,
            },
          }),
          { status: 200 },
        ),
      ),
    );

    render(<ResumenViajes deviceRevision={0} />);

    expect(await screen.findByText(/2\.500\.000/)).toBeInTheDocument();
    expect(screen.getByText("Total de viajes")).toBeInTheDocument();
    expect(screen.getByText("Planeados")).toBeInTheDocument();
    expect(screen.getByText("Completados")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/viajes/resumen?deviceId=device-test",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("muestra un error de API sin ocultarlo", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { mensaje: "No se pudo cargar el resumen." },
          }),
          { status: 500 },
        ),
      ),
    );

    render(<ResumenViajes deviceRevision={0} />);

    expect(
      await screen.findByText("No se pudo cargar el resumen."),
    ).toBeInTheDocument();
  });
});
