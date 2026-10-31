import { describe, expect, it } from 'vitest';
import { esperarCodigo } from './ayudas';
import {
  alternarEstado,
  etiquetaEstado,
  validarViaje,
  type DatosValidacionViaje,
} from '@/lib/reglas/viaje';

const viajeValido: DatosValidacionViaje = {
  destino: 'Cartagena',
  fechaInicio: '2026-12-10',
  fechaFin: '2026-12-15',
  presupuesto: 1_500_000,
};

describe('reglas de viaje', () => {
  it('T-09: rechaza un destino vacío o compuesto solo por espacios', () => {
    esperarCodigo(() => validarViaje({ ...viajeValido, destino: ' ' }), 'DATOS_INVALIDOS');
  });

  it('T-10: rechaza un destino de un carácter', () => {
    esperarCodigo(() => validarViaje({ ...viajeValido, destino: 'A' }), 'DATOS_INVALIDOS');
  });

  it('T-11: rechaza un presupuesto negativo', () => {
    esperarCodigo(() => validarViaje({ ...viajeValido, presupuesto: -1 }), 'DATOS_INVALIDOS');
  });

  it('T-12: rechaza un presupuesto decimal', () => {
    esperarCodigo(() => validarViaje({ ...viajeValido, presupuesto: 1_500.5 }), 'DATOS_INVALIDOS');
  });

  it('T-13: permite un presupuesto de cero', () => {
    expect(() => validarViaje({ ...viajeValido, presupuesto: 0 })).not.toThrow();
  });

  it('T-14: rechaza fechas que no existen en el calendario', () => {
    esperarCodigo(
      () => validarViaje({ ...viajeValido, fechaInicio: '2026-02-30' }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-15: distingue la fecha de fin anterior como error de negocio específico', () => {
    esperarCodigo(
      () => validarViaje({ ...viajeValido, fechaFin: '2026-12-05' }),
      'FECHA_FIN_ANTERIOR',
    );
  });

  it('T-16: acepta un viaje con datos válidos', () => {
    expect(() => validarViaje(viajeValido)).not.toThrow();
  });

  it('T-17: alterna entre planeado y completado', () => {
    expect(alternarEstado(false)).toBe(true);
    expect(alternarEstado(true)).toBe(false);
  });

  it('T-18: devuelve la etiqueta del estado correspondiente', () => {
    expect(etiquetaEstado(false)).toBe('Planeado');
    expect(etiquetaEstado(true)).toBe('Completado');
  });
});
