import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegistrationPage from './page';

const { getUserMock, signUpMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      signUp: signUpMock,
    },
  }),
}));

describe('Registration page', () => {
  beforeEach(() => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    signUpMock.mockResolvedValue({ data: { user: { id: 'new-user' }, session: null }, error: null });
  });

  it('registers a user and asks them to confirm their email', async () => {
    render(<RegistrationPage />);

    const name = 'Nuevo usuario';
    const email = 'nuevo@example.com';
    const password = 'new-password-123';
    fireEvent.change(await screen.findByLabelText('Nombre'), { target: { value: name } });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: email } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: password } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Revisa tu correo para confirmar');
    expect(signUpMock).toHaveBeenCalledWith({
      email,
      password,
      options: { data: { full_name: name } },
    });
  });
});