import { afterEach, describe, expect, it, vi } from "vitest";

const dependencias = vi.hoisted(() => ({
  crearCliente: vi.fn(),
  enviar: vi.fn(),
  obtenerToken: vi.fn(),
}));

vi.mock("@vercel/connect", () => ({
  getToken: dependencias.obtenerToken,
}));

vi.mock("resend", () => ({
  Resend: class {
    readonly emails = { send: dependencias.enviar };

    constructor(clave: string) {
      dependencias.crearCliente(clave);
    }
  },
}));

import { enviarCorreo } from "@/lib/correo";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("enviarCorreo", () => {
  it("rechaza enviar si falta un remitente verificado", async () => {
    vi.stubEnv("RESEND_FROM", "");

    await expect(
      enviarCorreo({
        para: "persona@example.com",
        asunto: "Restablecer contraseña",
        html: "<p>Enlace seguro</p>",
      }),
    ).resolves.toEqual({
      ok: false,
      error: "RESEND_FROM debe identificar un remitente verificado en Resend.",
    });

    expect(dependencias.crearCliente).not.toHaveBeenCalled();
    expect(dependencias.enviar).not.toHaveBeenCalled();
  });

  it("envía usando el remitente verificado configurado", async () => {
    vi.stubEnv("RESEND_API_KEY", "clave-falsa-de-prueba");
    vi.stubEnv("RESEND_FROM", "Montate en el viaje <viajes@example.com>");
    dependencias.enviar.mockResolvedValue({
      data: { id: "resend-id-1" },
      error: null,
    });

    await expect(
      enviarCorreo({
        para: "persona@example.com",
        asunto: "Restablecer contraseña",
        html: "<p>Enlace seguro</p>",
      }),
    ).resolves.toEqual({ ok: true, id: "resend-id-1" });

    expect(dependencias.crearCliente).toHaveBeenCalledWith(
      "clave-falsa-de-prueba",
    );
    expect(dependencias.enviar).toHaveBeenCalledWith({
      from: "Montate en el viaje <viajes@example.com>",
      to: "persona@example.com",
      subject: "Restablecer contraseña",
      html: "<p>Enlace seguro</p>",
    });
  });
});
