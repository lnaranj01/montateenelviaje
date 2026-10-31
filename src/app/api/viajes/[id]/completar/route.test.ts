import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  alternarCompletado: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  alternarCompletado: funciones.alternarCompletado,
}));

const deviceId = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000002";

describe("PATCH /api/viajes/[id]/completar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({ email: "viajero@example.com" });
    funciones.alternarCompletado.mockResolvedValue({
      id,
      completado: true,
      estado: "Completado",
    });
  });

  it("alterna el estado del viaje del dispositivo", async () => {
    const solicitud = new Request(
      `http://localhost/api/viajes/${id}/completar`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      },
    );
    const respuesta = await PATCH(solicitud, {
      params: Promise.resolve({ id }),
    });

    expect(respuesta.status).toBe(200);
    expect(funciones.alternarCompletado).toHaveBeenCalledWith(deviceId, id);
    expect(await respuesta.json()).toMatchObject({
      ok: true,
      datos: { estado: "Completado" },
    });
  });
});
