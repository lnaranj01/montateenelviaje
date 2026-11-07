import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FiltrosViajes } from "@/components/viajes/FiltrosViajes";

const funciones = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: funciones.usePathname,
  useRouter: funciones.useRouter,
}));

describe("FiltrosViajes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.usePathname.mockReturnValue("/viajes");
    funciones.useRouter.mockReturnValue({ push: funciones.push });
    window.history.replaceState({}, "", "/viajes?orden=inicio");
  });

  it("refleja el filtro de estado en la URL y conserva el orden", () => {
    render(<FiltrosViajes estado="" orden="inicio" />);

    fireEvent.change(screen.getByLabelText("Filtrar por estado"), {
      target: { value: "Completado" },
    });

    expect(funciones.push).toHaveBeenCalledWith(
      "/viajes?orden=inicio&estado=Completado",
      { scroll: false },
    );
  });

  it("refleja el orden seleccionado en la URL", () => {
    window.history.replaceState(
      {},
      "",
      "/viajes?estado=Planeado&orden=reciente",
    );
    render(<FiltrosViajes estado="Planeado" orden="reciente" />);

    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "inicio" },
    });

    expect(funciones.push).toHaveBeenCalledWith(
      "/viajes?estado=Planeado&orden=inicio",
      { scroll: false },
    );
  });
});
