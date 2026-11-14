import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { GET } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  buscarVuelosAmadeus: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  buscarVuelosAmadeus: funciones.buscarVuelosAmadeus,
}));

describe("/api/viajes/vuelos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({ email: "viajero@example.com" });
    funciones.buscarVuelosAmadeus.mockResolvedValue([]);
  });

  it("pide ofertas con los datos validados del viaje", async () => {
    const respuesta = await GET(
      new Request(
        "http://localhost/api/viajes/vuelos?origen=BOG&destino=CTG&fechaIda=2026-12-10&fechaRegreso=2026-12-12&viajeros=2&tipoRuta=nacional",
      ),
    );

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      ok: true,
      datos: { ofertas: [] },
    });
    expect(funciones.buscarVuelosAmadeus).toHaveBeenCalledWith({
      origen: "BOG",
      destino: "CTG",
      fechaIda: "2026-12-10",
      fechaRegreso: "2026-12-12",
      viajeros: 2,
      tipoRuta: "nacional",
    });
  });

  it("rechaza una fecha de regreso anterior a la fecha de ida", async () => {
    const respuesta = await GET(
      new Request(
        "http://localhost/api/viajes/vuelos?origen=BOG&destino=CTG&fechaIda=2026-12-12&fechaRegreso=2026-12-10&viajeros=2&tipoRuta=nacional",
      ),
    );

    expect(respuesta.status).toBe(400);
    expect(funciones.buscarVuelosAmadeus).not.toHaveBeenCalled();
  });

  it("exige sesión antes de consultar ofertas", async () => {
    funciones.exigirSesion.mockRejectedValue(
      new ErrorDeNegocio("NO_AUTORIZADO"),
    );

    const respuesta = await GET(
      new Request(
        "http://localhost/api/viajes/vuelos?origen=BOG&destino=CTG&fechaIda=2026-12-10&viajeros=2&tipoRuta=nacional",
      ),
    );

    expect(respuesta.status).toBe(401);
    expect(funciones.buscarVuelosAmadeus).not.toHaveBeenCalled();
  });
});
