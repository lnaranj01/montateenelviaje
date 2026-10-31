import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormularioViaje } from "@/components/viajes/FormularioViaje";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import type { Viaje } from "@/lib/datos/tipos";

vi.mock("@/lib/hooks/useDeviceId", () => ({
  useDeviceId: vi.fn(),
}));

const viajeDemo: Viaje = {
  id: "viaje-test",
  destino: "Cartagena",
  fechaInicio: "2026-12-10",
  fechaFin: "2026-12-12",
  presupuesto: 500000,
  completado: false,
  estado: "Planeado",
  duracionDias: 3,
};

const alGuardar = vi.fn();
const alCancelarEdicion = vi.fn();
const alInteractuar = vi.fn();

function renderFormulario(viaje: Viaje | null = null) {
  return render(
    <FormularioViaje
      alCancelarEdicion={alCancelarEdicion}
      alGuardar={alGuardar}
      alInteractuar={alInteractuar}
      viaje={viaje}
    />,
  );
}

describe("FormularioViaje", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("valida en vivo que la fecha de fin no sea anterior a la de inicio", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    const fetchSimulado = vi.fn();
    vi.stubGlobal("fetch", fetchSimulado);
    renderFormulario();

    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: "Cartagena" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), {
      target: { value: "2026-12-15" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de fin"), {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByLabelText("Presupuesto (COP)"), {
      target: { value: "1500000" },
    });

    const mensaje = await screen.findByText(
      "La fecha de fin no puede ser anterior a la de inicio.",
    );
    expect(mensaje).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha de fin")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar viaje" }));
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("rechaza los presupuestos decimales y negativos", () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    const fetchSimulado = vi.fn();
    vi.stubGlobal("fetch", fetchSimulado);
    renderFormulario();

    fireEvent.change(screen.getByLabelText("Presupuesto (COP)"), {
      target: { value: "1500.5" },
    });

    expect(
      screen.getByText("Ingresa un presupuesto entero igual o mayor a 0."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Presupuesto (COP)"), {
      target: { value: "-1" },
    });
    expect(
      screen.getByText("Ingresa un presupuesto entero igual o mayor a 0."),
    ).toBeInTheDocument();
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("crea un viaje con presupuesto entero y refresca mediante el callback", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    const fetchSimulado = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, datos: viajeDemo }), {
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchSimulado);
    renderFormulario();

    fireEvent.change(screen.getByLabelText("Destino"), {
      target: { value: " Cartagena " },
    });
    fireEvent.change(screen.getByLabelText("Fecha de inicio"), {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByLabelText("Fecha de fin"), {
      target: { value: "2026-12-12" },
    });
    fireEvent.change(screen.getByLabelText("Presupuesto (COP)"), {
      target: { value: "1500000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar viaje" }));

    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith("crear"));
    expect(fetchSimulado).toHaveBeenCalledWith(
      "/api/viajes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          deviceId: "device-test",
          destino: "Cartagena",
          fechaInicio: "2026-12-10",
          fechaFin: "2026-12-12",
          presupuesto: 1500000,
        }),
      }),
    );
  });

  it("precarga y actualiza un viaje con PATCH", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    const fetchSimulado = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, datos: viajeDemo }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchSimulado);
    renderFormulario(viajeDemo);

    expect(screen.getByLabelText("Destino")).toHaveValue("Cartagena");
    fireEvent.click(screen.getByRole("button", { name: "Actualizar viaje" }));

    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith("editar"));
    expect(fetchSimulado).toHaveBeenCalledWith(
      "/api/viajes/viaje-test",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          deviceId: "device-test",
          destino: "Cartagena",
          fechaInicio: "2026-12-10",
          fechaFin: "2026-12-12",
          presupuesto: 500000,
        }),
      }),
    );
  });

  it("muestra el mensaje de error del servidor", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            error: { mensaje: "El viaje no existe." },
          }),
          { status: 404 },
        ),
      ),
    );
    renderFormulario(viajeDemo);

    fireEvent.click(screen.getByRole("button", { name: "Actualizar viaje" }));

    expect(await screen.findByText("El viaje no existe.")).toBeInTheDocument();
    expect(alGuardar).not.toHaveBeenCalled();
  });

  it("permite cancelar el modo de edición", () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    renderFormulario(viajeDemo);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(alCancelarEdicion).toHaveBeenCalledOnce();
  });
});
