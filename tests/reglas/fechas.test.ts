import { describe, expect, it } from 'vitest';
import { duracionDias, esFechaValida, finNoAnteriorAInicio } from '@/lib/reglas/fechas';

describe('reglas de fechas', () => {
  it('T-01: acepta una fecha válida en formato YYYY-MM-DD', () => {
    expect(esFechaValida('2026-12-10')).toBe(true);
  });

  it('T-02: rechaza un mes fuera de rango', () => {
    expect(esFechaValida('2026-13-10')).toBe(false);
  });

  it('T-03: rechaza un formato distinto de YYYY-MM-DD', () => {
    expect(esFechaValida('10/12/2026')).toBe(false);
  });

  it('T-04: permite una fecha de fin posterior al inicio', () => {
    expect(finNoAnteriorAInicio('2026-12-10', '2026-12-15')).toBe(true);
  });

  it('T-05: permite un viaje de un solo día', () => {
    expect(finNoAnteriorAInicio('2026-12-10', '2026-12-10')).toBe(true);
  });

  it('T-06: rechaza una fecha de fin anterior al inicio', () => {
    expect(finNoAnteriorAInicio('2026-12-15', '2026-12-10')).toBe(false);
  });

  it('T-07: calcula la duración inclusiva de seis días', () => {
    expect(duracionDias('2026-12-10', '2026-12-15')).toBe(6);
  });

  it('T-08: calcula un día para un viaje de la misma fecha', () => {
    expect(duracionDias('2026-12-10', '2026-12-10')).toBe(1);
  });
});
