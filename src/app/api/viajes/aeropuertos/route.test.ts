import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeNegocio } from "@/lib/reglas/errores";
import { GET } from "./route";

const funciones = vi.hoisted(() => ({
  exigirSesion: vi.fn(),
  buscarAeropuertos: vi.fn(),
}));

vi.mock("@/lib/auth/sesion", () => ({
  exigirSesion: funciones.exigirSesion,
}));

vi.mock("@/lib/dataService", () => ({
  buscarAeropuertos: funciones.buscarAeropuertos,
}));

describe("/api/viajes/aeropuertos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.exigirSesion.mockResolvedValue({ email: "viajero@example.com" });
    funciones.buscarAeropuertos.mockResolvedValue([
      {
        codigo: "CTG",
        nombre: "Rafael Núñez International Airport",
        ciudad: "Cartagena",
        pais: "Colombia",
        codigoPais: "CO",
      },
    ]);
  });

  it("consulta aeropuertos de Colombia para rutas nacionales", async () => {
    const respuesta = await GET(
      new Request(
        "http://localhost/api/viajes/aeropuertos?consulta=Cartagena&tipoRuta=nacional",
      ),
    );

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({
      ok: true,
      datos: { aeropuertos: [{ codigo: "CTG" }] },
    });
    expect(funciones.buscarAeropuertos).toHaveBeenCalledWith(
      "Cartagena",
      "nacional",
    );
  });

  it("rechaza búsquedas inválidas sin llamar al proveedor", async () => {
    const respuesta = await GET(
      new Request(
        "http://localhost/api/viajes/aeropuertos?consulta=a&tipoRuta=nacional",
      ),
    );

    expect(respuesta.status).toBe(400);
    expect(funciones.buscarAeropuertos).not.toHaveBeenCalled();
  });

  it("exige sesión antes de consultar el proveedor", async () => {
    funciones.exigirSesion.mockRejectedValue(
      new ErrorDeNegocio("NO_AUTORIZADO"),
    );

    const respuesta = await GET(
      new Request(
        "http://localhost/api/viajes/aeropuertos?consulta=Cartagena&tipoRuta=nacional",
      ),
    );

    expect(respuesta.status).toBe(401);
    expect(funciones.buscarAeropuertos).not.toHaveBeenCalled();
  });
});
