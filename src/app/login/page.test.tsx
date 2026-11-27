import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

const { getUserMock, replaceMock, signInWithPasswordMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  replaceMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInWithPasswordMock,
    },
  }),
}));

describe('Login page', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/login');
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    signInWithPasswordMock.mockResolvedValue({ error: null });
    replaceMock.mockReset();
  });

  it('links the project name to user administration', () => {
    render(<LoginPage />);

    expect(screen.getByRole('link', { name: 'Montate en el viaje' })).toHaveAttribute(
      'href',
      '/admin/usuarios',
    );
  });

  it('returns to user administration after signing in from that route', async () => {
    window.history.replaceState({}, '', '/login?next=%2Fadmin%2Fusuarios');
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/admin/usuarios');
    });
  });
});
