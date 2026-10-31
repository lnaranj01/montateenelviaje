import { expect } from 'vitest';
import type { CodigoError } from '@/lib/reglas/errores';

export function esperarCodigo(fn: () => unknown, codigo: CodigoError): void {
  expect(fn).toThrowError(expect.objectContaining({ codigo }));
}
