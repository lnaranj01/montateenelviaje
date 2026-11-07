import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { GET, POST } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  listarPlanesGuardados: vi.fn(),
  crearPlanGuardado: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  listarPlanesGuardados: funciones.listarPlanesGuardados,
  crearPlanGuardado: funciones.crearPlanGuardado,
}));

const deviceId = "00000000-0000-4000-8000-000000000001";
const plan = {
  id: "00000000-0000-4000-8000-000000000003",
  origen: "Bogotá",
  destino: "Cartagena",
  fechaInicio: "2026-12-10",
  fechaFin: "2026-12-12",
  presupuesto: 50_000_000,
  viajeros: 2,
  servicios: [
    {
      id: "vuelo-economico",
      categoria: "Vuelos",
      nombre: "Vuelo nacional de muestra",
      descripcion: "Ejemplo de vuelo ida y vuelta por viajero.",
      proporcionPresupuestoDiario: 0.9,
      unidad: "viajero",
      precio: 15_000_000,
    },
  ],
  total: 15_000_000,
};

function crearSolicitud(cuerpo: unknown): Request {
  return new Request("http://localhost/api/viajes/planes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

describe("/api/viajes/planes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({
      email: "viajero@example.com",
    });
    funciones.listarPlanesGuardados.mockResolvedValue([plan]);
    funciones.crearPlanGuardado.mockResolvedValue(plan);
  });

  it("lista únicamente los planes del deviceId solicitado", async () => {
    const respuesta = await GET(
      new Request(`http://localhost/api/viajes/planes?deviceId=${deviceId}`),
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
    expect(await respuesta.json()).toEqual({
      ok: true,
      datos: { planes: [plan] },
    });
    expect(funciones.listarPlanesGuardados).toHaveBeenCalledWith(deviceId);
  });

  it("guarda los datos del plan y responde con estado creado", async () => {
    const respuesta = await POST(
      crearSolicitud({
        deviceId,
        origen: "Bogotá",
        destino: "Cartagena",
        fechaInicio: "2026-12-10",
        fechaFin: "2026-12-12",
        presupuesto: 50_000_000,
        viajeros: 2,
        servicios: ["vuelo-economico"],
      }),
    );

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toEqual({ ok: true, datos: plan });
    expect(funciones.crearPlanGuardado).toHaveBeenCalledWith(deviceId, {
      origen: "Bogotá",
      destino: "Cartagena",
      fechaInicio: "2026-12-10",
      fechaFin: "2026-12-12",
      presupuesto: 50_000_000,
      viajeros: 2,
      servicios: ["vuelo-economico"],
    });
  });

  it("exige sesión antes de acceder a los planes", async () => {
    funciones.exigirSesion.mockRejectedValue(
      new ErrorDeNegocio("NO_AUTORIZADO"),
    );

    const respuesta = await GET(
      new Request(`http://localhost/api/viajes/planes?deviceId=${deviceId}`),
    );

    expect(respuesta.status).toBe(401);
    expect(funciones.listarPlanesGuardados).not.toHaveBeenCalled();
  });

  it("rechaza selecciones duplicadas por categoría antes de guardar", async () => {
    const respuesta = await POST(
      crearSolicitud({
        deviceId,
        origen: "Bogotá",
        destino: "Cartagena",
        fechaInicio: "2026-12-10",
        fechaFin: "2026-12-12",
        presupuesto: 50_000_000,
        viajeros: 2,
        servicios: ["vuelo-economico", "vuelo-flexible"],
      }),
    );

    expect(respuesta.status).toBe(400);
    expect(funciones.crearPlanGuardado).not.toHaveBeenCalled();
  });
});
