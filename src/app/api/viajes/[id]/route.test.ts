import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { DELETE, GET, PATCH } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  obtenerViaje: vi.fn(),
  editarViaje: vi.fn(),
  eliminarViaje: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  obtenerViaje: funciones.obtenerViaje,
  editarViaje: funciones.editarViaje,
  eliminarViaje: funciones.eliminarViaje,
}));

const deviceId = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000002";
const datos = {
  destino: "Cartagena",
  fechaInicio: "2026-12-10",
  fechaFin: "2026-12-15",
  presupuesto: 1_500_000,
};
const viaje = {
  id,
  ...datos,
  completado: false,
  estado: "Planeado",
  duracionDias: 6,
};
const contexto = { params: Promise.resolve({ id }) };

function crearSolicitud(metodo: "PATCH" | "DELETE", cuerpo: unknown): Request {
  return new Request(`http://localhost/api/viajes/${id}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

describe("/api/viajes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({ email: "viajero@example.com" });
    funciones.obtenerViaje.mockResolvedValue(viaje);
    funciones.editarViaje.mockResolvedValue(viaje);
    funciones.eliminarViaje.mockResolvedValue(undefined);
  });

  it("obtiene un viaje con params como Promise y filtra por dispositivo", async () => {
    const respuesta = await GET(
      new Request(`http://localhost/api/viajes/${id}?deviceId=${deviceId}`),
      contexto,
    );

    expect(respuesta.status).toBe(200);
    expect(funciones.obtenerViaje).toHaveBeenCalledWith(deviceId, id);
    expect(await respuesta.json()).toEqual({ ok: true, datos: viaje });
  });

  it("actualiza los campos del viaje", async () => {
    const respuesta = await PATCH(
      crearSolicitud("PATCH", { deviceId, ...datos }),
      contexto,
    );

    expect(respuesta.status).toBe(200);
    expect(funciones.editarViaje).toHaveBeenCalledWith(deviceId, id, datos);
  });

  it("elimina un viaje y confirma la operación", async () => {
    const respuesta = await DELETE(
      crearSolicitud("DELETE", { deviceId }),
      contexto,
    );

    expect(respuesta.status).toBe(200);
    expect(funciones.eliminarViaje).toHaveBeenCalledWith(deviceId, id);
    expect(await respuesta.json()).toEqual({
      ok: true,
      datos: { eliminado: true },
    });
  });

  it("rechaza UUID inválido antes de consultar", async () => {
    const respuesta = await GET(
      new Request(`http://localhost/api/viajes/invalido?deviceId=${deviceId}`),
      { params: Promise.resolve({ id: "invalido" }) },
    );

    expect(respuesta.status).toBe(400);
    expect(funciones.obtenerViaje).not.toHaveBeenCalled();
  });

  it("conserva el 404 de viaje no encontrado", async () => {
    funciones.obtenerViaje.mockRejectedValue(
      new ErrorDeNegocio("VIAJE_NO_ENCONTRADO"),
    );

    const respuesta = await GET(
      new Request(`http://localhost/api/viajes/${id}?deviceId=${deviceId}`),
      contexto,
    );

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toMatchObject({
      ok: false,
      error: { codigo: "VIAJE_NO_ENCONTRADO" },
    });
  });
});
