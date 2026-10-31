import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListaViajes } from "@/components/viajes/ListaViajes";
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

function respuestaLista(viajes: Viaje[]) {
  return new Response(
    JSON.stringify({ ok: true, datos: { viajes, total: viajes.length } }),
    { status: 200 },
  );
}

function ListaConActualizacion() {
  const [revision, setRevision] = useState(0);

  return (
    <ListaViajes
      alCambiar={() => setRevision((actual) => actual + 1)}
      alEditar={vi.fn()}
      revision={revision}
    />
  );
}

describe("ListaViajes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("muestra el contador y el mensaje acordado cuando no hay viajes", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaLista([])));

    render(<ListaViajes alCambiar={vi.fn()} alEditar={vi.fn()} revision={0} />);

    expect(await screen.findByText("Tienes 0 viajes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aún no has registrado viajes. Completa el formulario de arriba para agregar el primero.",
      ),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/viajes?deviceId=device-test",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("muestra los datos y permite editar la tarjeta", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respuestaLista([viajeDemo])),
    );
    const alEditar = vi.fn();

    render(
      <ListaViajes alCambiar={vi.fn()} alEditar={alEditar} revision={0} />,
    );

    expect(
      await screen.findByRole("heading", { name: "Cartagena" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tienes 1 viaje")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Completar Cartagena" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Editar Cartagena" }));
    expect(alEditar).toHaveBeenCalledWith(viajeDemo);
  });

  it("confirma la eliminación y actualiza la lista y el contador", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    const fetchSimulado = vi
      .fn()
      .mockResolvedValueOnce(respuestaLista([viajeDemo]))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, datos: { eliminado: true } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(respuestaLista([]));
    vi.stubGlobal("fetch", fetchSimulado);

    render(<ListaConActualizacion />);
    await screen.findByRole("heading", { name: "Cartagena" });

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Cartagena" }));
    const dialogo = screen.getByRole("dialog", {
      name: "Confirmar eliminación",
    });
    expect(
      within(dialogo).getByText(
        "¿Eliminar el viaje a Cartagena? Esta acción no se puede deshacer.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(fetchSimulado).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Cartagena" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Confirmar eliminación" }),
      ).getByRole("button", { name: "Eliminar" }),
    );

    expect(await screen.findByText("Tienes 0 viajes")).toBeInTheDocument();
    expect(fetchSimulado).toHaveBeenCalledTimes(3);
    expect(fetchSimulado.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ deviceId: "device-test" }),
      }),
    );
  });

  it("alterna el estado y vuelve a cargar la tarjeta", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    const viajeCompletado = {
      ...viajeDemo,
      completado: true,
      estado: "Completado" as const,
    };
    const fetchSimulado = vi
      .fn()
      .mockResolvedValueOnce(respuestaLista([viajeDemo]))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, datos: viajeCompletado }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(respuestaLista([viajeCompletado]));
    vi.stubGlobal("fetch", fetchSimulado);

    render(<ListaConActualizacion />);
    await screen.findByRole("heading", { name: "Cartagena" });
    fireEvent.click(
      screen.getByRole("button", { name: "Completar Cartagena" }),
    );

    expect(
      await screen.findByRole("button", { name: "Reactivar Cartagena" }),
    ).toBeEnabled();
    expect(screen.getByText("Completado")).toBeInTheDocument();
    expect(fetchSimulado).toHaveBeenCalledTimes(3);
  });

  it("informa el error de API y permite reintentar", async () => {
    vi.mocked(useDeviceId).mockReturnValue("device-test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: { mensaje: "No se pudieron cargar los viajes." },
            }),
            { status: 500 },
          ),
        )
        .mockResolvedValueOnce(respuestaLista([])),
    );

    render(<ListaViajes alCambiar={vi.fn()} alEditar={vi.fn()} revision={0} />);

    expect(
      await screen.findByText("No se pudieron cargar los viajes."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));

    expect(await screen.findByText("Tienes 0 viajes")).toBeInTheDocument();
  });
});
