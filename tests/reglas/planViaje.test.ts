import { describe, expect, it } from "vitest";
import {
  calcularServiciosPlanViaje,
  validarServiciosPlanViaje,
} from "@/lib/reglas/planViaje";

describe("plan de viaje guardado", () => {
  it("calcula los importes de los servicios con presupuesto, duración y viajeros", () => {
    const servicios = calcularServiciosPlanViaje(
      ["vuelo-economico", "hospedaje-sencillo"],
      {
        presupuesto: 50_000_000,
        dias: 3,
        noches: 2,
        viajeros: 2,
      },
    );

    expect(servicios.map(({ id, precio }) => ({ id, precio }))).toEqual([
      { id: "vuelo-economico", precio: 15_000_000 },
      { id: "hospedaje-sencillo", precio: 10_000_000 },
    ]);
  });

  it("rechaza seleccionar más de un servicio de la misma categoría", () => {
    expect(
      validarServiciosPlanViaje(["vuelo-economico", "vuelo-flexible"]),
    ).toBe(false);
  });

  it("rechaza una selección vacía", () => {
    expect(validarServiciosPlanViaje([])).toBe(false);
  });
});
