import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Boton } from "@/components/ui/Boton";
import { Modal } from "@/components/ui/Modal";

function ModalDePrueba() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Boton onClick={() => setAbierto(true)}>Abrir confirmación</Boton>
      <Modal
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Confirmar eliminación"
      >
        <Boton>Cancelar</Boton>
        <Boton>Eliminar</Boton>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("enfoca el diálogo, cierra con Escape y devuelve el foco al control inicial", () => {
    render(<ModalDePrueba />);

    const botonAbrir = screen.getByRole("button", {
      name: "Abrir confirmación",
    });
    botonAbrir.focus();
    fireEvent.click(botonAbrir);

    const dialogo = screen.getByRole("dialog", {
      name: "Confirmar eliminación",
    });
    expect(dialogo).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cerrar diálogo" }),
    ).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(botonAbrir).toHaveFocus();
  });

  it("mantiene el foco dentro del diálogo al recorrer los botones con Tab", () => {
    render(<ModalDePrueba />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir confirmación" }));

    const botonCerrar = screen.getByRole("button", {
      name: "Cerrar diálogo",
    });
    const botonEliminar = screen.getByRole("button", { name: "Eliminar" });

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(botonEliminar).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(botonCerrar).toHaveFocus();
  });
});
