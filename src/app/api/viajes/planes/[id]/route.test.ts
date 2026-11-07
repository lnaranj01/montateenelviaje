import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { DELETE } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  eliminarPlanGuardado: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  eliminarPlanGuardado: funciones.eliminarPlanGuardado,
}));

const deviceId = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000010";
const contexto = { params: Promise.resolve({ id }) };

function crearSolicitud(cuerpo: unknown): Request {
  return new Request(`http://localhost/api/viajes/planes/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

describe("/api/viajes/planes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({ email: "viajero@example.com" });
    funciones.eliminarPlanGuardado.mockResolvedValue(undefined);
  });

  it("elimina el plan filtrando por dispositivo e identificador", async () => {
    const respuesta = await DELETE(crearSolicitud({ deviceId }), contexto);

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      ok: true,
      datos: { eliminado: true },
    });
    expect(funciones.eliminarPlanGuardado).toHaveBeenCalledWith(deviceId, id);
  });

  it("exige sesión antes de intentar eliminar el plan", async () => {
    funciones.exigirSesion.mockRejectedValue(
      new ErrorDeNegocio("NO_AUTORIZADO"),
    );

    const respuesta = await DELETE(crearSolicitud({ deviceId }), contexto);

    expect(respuesta.status).toBe(401);
    expect(funciones.eliminarPlanGuardado).not.toHaveBeenCalled();
  });

  it("rechaza identificadores inválidos antes de eliminar", async () => {
    const respuesta = await DELETE(crearSolicitud({ deviceId }), {
      params: Promise.resolve({ id: "invalido" }),
    });

    expect(respuesta.status).toBe(400);
    expect(funciones.eliminarPlanGuardado).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el plan no pertenece al dispositivo", async () => {
    funciones.eliminarPlanGuardado.mockRejectedValue(
      new ErrorDeNegocio("PLAN_NO_ENCONTRADO"),
    );

    const respuesta = await DELETE(crearSolicitud({ deviceId }), contexto);

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toMatchObject({
      ok: false,
      error: { codigo: "PLAN_NO_ENCONTRADO" },
    });
  });
});
