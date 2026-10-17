import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const funciones = vi.hoisted(() => ({
  actualizarContrasena: vi.fn(),
  buscarTokenVigente: vi.fn(),
  invalidarTokensPendientes: vi.fn(),
  marcarTokenComoUsado: vi.fn(),
  calcularHashToken: vi.fn(),
}));

vi.mock('@/lib/dataService', () => ({
  actualizarContrasena: funciones.actualizarContrasena,
  buscarTokenVigente: funciones.buscarTokenVigente,
  invalidarTokensPendientes: funciones.invalidarTokensPendientes,
  marcarTokenComoUsado: funciones.marcarTokenComoUsado,
}));

vi.mock('@/lib/tokenRecuperacion', () => ({ calcularHashToken: funciones.calcularHashToken }));

function crearSolicitud(cuerpo: unknown) {
  return new Request('http://localhost/api/auth/restablecer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

describe('POST /api/auth/restablecer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.actualizarContrasena.mockResolvedValue(undefined);
    funciones.buscarTokenVigente.mockResolvedValue({ token_id: 'token-1', usuario_id: 'usuario-1' });
    funciones.invalidarTokensPendientes.mockResolvedValue(undefined);
    funciones.marcarTokenComoUsado.mockResolvedValue(true);
    funciones.calcularHashToken.mockReturnValue('hash-prueba');
  });

  it('actualiza la contraseña una sola vez y consume el token', async () => {
    const cuerpo = {
      token: 'a'.repeat(64),
      contrasena: 'clave-nueva-segura',
      confirmacion: 'clave-nueva-segura',
    };

    const respuesta = await POST(crearSolicitud(cuerpo));

    expect(respuesta.status).toBe(200);
    expect(funciones.buscarTokenVigente).toHaveBeenCalledWith('hash-prueba');
    expect(funciones.marcarTokenComoUsado).toHaveBeenCalledWith('token-1');
    expect(funciones.actualizarContrasena).toHaveBeenCalledWith('usuario-1', cuerpo.contrasena);
    expect(funciones.invalidarTokensPendientes).toHaveBeenCalledWith('usuario-1');
  });

  it('rechaza un token que ya no se puede consumir', async () => {
    funciones.marcarTokenComoUsado.mockResolvedValue(false);

    const respuesta = await POST(crearSolicitud({
      token: 'a'.repeat(64),
      contrasena: 'clave-nueva-segura',
      confirmacion: 'clave-nueva-segura',
    }));

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({ error: 'El enlace no es válido o ya venció.' });
    expect(funciones.actualizarContrasena).not.toHaveBeenCalled();
  });
});