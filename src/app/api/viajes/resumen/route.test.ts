import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  obtenerResumen: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  obtenerResumen: funciones.obtenerResumen,
}));

const deviceId = "00000000-0000-4000-8000-000000000001";

describe("GET /api/viajes/resumen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({ email: "viajero@example.com" });
    funciones.obtenerResumen.mockResolvedValue({
      total: 2,
      planeados: 1,
      completados: 1,
      presupuestoTotal: 2_500_000,
    });
  });

  it("devuelve el resumen acotado al dispositivo", async () => {
    const respuesta = await GET(
      new Request(`http://localhost/api/viajes/resumen?deviceId=${deviceId}`),
    );

    expect(respuesta.status).toBe(200);
    expect(funciones.obtenerResumen).toHaveBeenCalledWith(deviceId);
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rechaza una solicitud sin deviceId", async () => {
    const respuesta = await GET(
      new Request("http://localhost/api/viajes/resumen"),
    );

    expect(respuesta.status).toBe(400);
    expect(funciones.obtenerResumen).not.toHaveBeenCalled();
  });
});
