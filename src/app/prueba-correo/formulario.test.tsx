import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FormularioPruebaCorreo from './formulario';

describe('Formulario de prueba de correo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra el identificador de Resend cuando acepta el envío', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Correo enviado', id: 'resend-id-prueba' }),
    }));

    render(<FormularioPruebaCorreo />);
    fireEvent.change(screen.getByLabelText('Correo electrónico de destino'), {
      target: { value: 'persona@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar prueba' }));

    expect(await screen.findByText(/Resend aceptó la solicitud/)).toBeInTheDocument();
    expect(screen.getByText('resend-id-prueba')).toBeInTheDocument();
  });
});