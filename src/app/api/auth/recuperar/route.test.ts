import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const funciones = vi.hoisted(() => ({
  buscarUsuarioPorCorreo: vi.fn(),
  contarSolicitudesRecientes: vi.fn(),
  crearTokenRecuperacion: vi.fn(),
  enviarCorreo: vi.fn(),
  plantillaRecuperacion: vi.fn(),
  calcularHashToken: vi.fn(),
  generarToken: vi.fn(),
  obtenerUrlBase: vi.fn(),
}));

vi.mock('@/lib/dataService', () => ({
  buscarUsuarioPorCorreo: funciones.buscarUsuarioPorCorreo,
  contarSolicitudesRecientes: funciones.contarSolicitudesRecientes,
  crearTokenRecuperacion: funciones.crearTokenRecuperacion,
}));

vi.mock('@/lib/correo', () => ({ enviarCorreo: funciones.enviarCorreo }));
vi.mock('@/lib/plantillasCorreo', () => ({ plantillaRecuperacion: funciones.plantillaRecuperacion }));
vi.mock('@/lib/tokenRecuperacion', () => ({
  calcularHashToken: funciones.calcularHashToken,
  generarToken: funciones.generarToken,
}));
vi.mock('@/lib/urlBase', () => ({ obtenerUrlBase: funciones.obtenerUrlBase }));

function crearSolicitud(cuerpo: unknown) {
  return new Request('http://localhost/api/auth/recuperar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

describe('POST /api/auth/recuperar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    funciones.buscarUsuarioPorCorreo.mockResolvedValue(null);
    funciones.contarSolicitudesRecientes.mockResolvedValue(0);
    funciones.crearTokenRecuperacion.mockResolvedValue(true);
    funciones.enviarCorreo.mockResolvedValue({ ok: true, id: 'correo-prueba' });
    funciones.plantillaRecuperacion.mockReturnValue('<p>Recuperación</p>');
    funciones.calcularHashToken.mockReturnValue('hash-prueba');
    funciones.generarToken.mockReturnValue('a'.repeat(64));
    funciones.obtenerUrlBase.mockReturnValue('http://localhost:3000');
  });

  it('responde igual cuando el correo no está registrado', async () => {
    const respuesta = await POST(crearSolicitud({ email: 'nadie@example.com' }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      message: 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.',
    });
    expect(funciones.enviarCorreo).not.toHaveBeenCalled();
  });

  it('mantiene la respuesta genérica cuando Resend informa un fallo', async () => {
    funciones.buscarUsuarioPorCorreo.mockResolvedValue({ id: 'usuario-1', correo: 'persona@example.com' });
    funciones.enviarCorreo.mockResolvedValue({ ok: false, error: 'Fallo de envío' });

    const respuesta = await POST(crearSolicitud({ email: 'persona@example.com' }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toHaveProperty('message', 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.');
    expect(funciones.crearTokenRecuperacion).toHaveBeenCalledWith('usuario-1', 'hash-prueba');
  });

  it('no crea más de tres solicitudes en quince minutos', async () => {
    funciones.buscarUsuarioPorCorreo.mockResolvedValue({ id: 'usuario-1', correo: 'persona@example.com' });
    funciones.contarSolicitudesRecientes.mockResolvedValue(3);

    const respuesta = await POST(crearSolicitud({ email: 'persona@example.com' }));

    expect(respuesta.status).toBe(200);
    expect(funciones.crearTokenRecuperacion).not.toHaveBeenCalled();
    expect(funciones.enviarCorreo).not.toHaveBeenCalled();
  });
});