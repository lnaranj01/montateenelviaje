import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { GET, POST } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  listarViajes: vi.fn(),
  contarViajes: vi.fn(),
  crearViaje: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  listarViajes: funciones.listarViajes,
  contarViajes: funciones.contarViajes,
  crearViaje: funciones.crearViaje,
}));

const deviceId = "00000000-0000-4000-8000-000000000001";
const viaje = {
  id: "00000000-0000-4000-8000-000000000002",
  destino: "Cartagena",
  fechaInicio: "2026-12-10",
  fechaFin: "2026-12-15",
  presupuesto: 1_500_000,
  completado: false,
  estado: "Planeado",
  duracionDias: 6,
};

function crearSolicitud(cuerpo: unknown): Request {
  return new Request("http://localhost/api/viajes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

describe("/api/viajes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({ email: "viajero@example.com" });
    funciones.listarViajes.mockResolvedValue([viaje]);
    funciones.contarViajes.mockResolvedValue(1);
    funciones.crearViaje.mockResolvedValue(viaje);
  });

  it("lista por dispositivo y responde con el contador total sin caché", async () => {
    const respuesta = await GET(
      new Request(
        `http://localhost/api/viajes?deviceId=${deviceId}&estado=Planeado&orden=inicio`,
      ),
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
    expect(await respuesta.json()).toEqual({
      ok: true,
      datos: { viajes: [viaje], total: 1 },
    });
    expect(funciones.listarViajes).toHaveBeenCalledWith(deviceId, {
      estado: "Planeado",
      orden: "inicio",
    });
    expect(funciones.contarViajes).toHaveBeenCalledWith(deviceId);
  });

  it("rechaza deviceId y filtros inválidos antes de consultar datos", async () => {
    const respuesta = await GET(
      new Request(
        "http://localhost/api/viajes?deviceId=incorrecto&estado=cancelado",
      ),
    );

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({
      ok: false,
      error: { codigo: "DATOS_INVALIDOS" },
    });
    expect(funciones.listarViajes).not.toHaveBeenCalled();
  });

  it("crea un viaje con estado HTTP 201", async () => {
    const respuesta = await POST(
      crearSolicitud({
        deviceId,
        destino: "Cartagena",
        fechaInicio: "2026-12-10",
        fechaFin: "2026-12-15",
        presupuesto: "1500000",
      }),
    );

    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toEqual({ ok: true, datos: viaje });
    expect(funciones.crearViaje).toHaveBeenCalledWith(deviceId, {
      destino: "Cartagena",
      fechaInicio: "2026-12-10",
      fechaFin: "2026-12-15",
      presupuesto: 1_500_000,
    });
  });

  it("traduce fechas invertidas a 422", async () => {
    funciones.crearViaje.mockRejectedValue(
      new ErrorDeNegocio("FECHA_FIN_ANTERIOR"),
    );

    const respuesta = await POST(
      crearSolicitud({
        deviceId,
        destino: "Cartagena",
        fechaInicio: "2026-12-15",
        fechaFin: "2026-12-10",
        presupuesto: 1_500_000,
      }),
    );

    expect(respuesta.status).toBe(422);
    expect(await respuesta.json()).toMatchObject({
      ok: false,
      error: { codigo: "FECHA_FIN_ANTERIOR" },
    });
  });

  it("exige sesión antes de ejecutar operaciones de datos", async () => {
    funciones.exigirSesion.mockRejectedValue(
      new ErrorDeNegocio("NO_AUTORIZADO"),
    );

    const respuesta = await GET(
      new Request(`http://localhost/api/viajes?deviceId=${deviceId}`),
    );

    expect(respuesta.status).toBe(401);
    expect(funciones.listarViajes).not.toHaveBeenCalled();
    expect(funciones.contarViajes).not.toHaveBeenCalled();
  });
});
