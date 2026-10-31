"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Boton } from "@/components/ui/Boton";

interface ModalProps {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  children: ReactNode;
}

export function Modal({ abierto, alCerrar, children, titulo }: ModalProps) {
  const dialogoRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const dialogo = dialogoRef.current;
    const focoAnterior =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const selectorEnfocable =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elementosEnfocables = dialogo
      ? Array.from(dialogo.querySelectorAll<HTMLElement>(selectorEnfocable))
      : [];

    (elementosEnfocables[0] ?? dialogo)?.focus();

    function manejarTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        alCerrar();
        return;
      }

      if (evento.key !== "Tab" || elementosEnfocables.length === 0) {
        return;
      }

      const primero = elementosEnfocables[0];
      const ultimo = elementosEnfocables[elementosEnfocables.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo?.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero?.focus();
      }
    }

    document.addEventListener("keydown", manejarTeclado);
    return () => {
      document.removeEventListener("keydown", manejarTeclado);
      focoAnterior?.focus();
    };
  }, [abierto, alCerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          alCerrar();
        }
      }}
    >
      <div
        aria-labelledby={tituloId}
        aria-modal="true"
        className="w-full max-w-lg rounded-lg bg-superficie p-6 text-texto shadow-2xl"
        ref={dialogoRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <Boton
            aria-label="Cerrar diálogo"
            className="min-h-10 px-3"
            onClick={alCerrar}
            variante="fantasma"
          >
            Cerrar
          </Boton>
        </div>
        {children}
      </div>
    </div>
  );
}
