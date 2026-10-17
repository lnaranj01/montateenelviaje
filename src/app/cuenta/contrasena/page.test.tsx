import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePasswordPage from './page';

const { getUserMock, updateUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      updateUser: updateUserMock,
    },
  }),
}));

describe('Change password page', () => {
  beforeEach(() => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null });
    updateUserMock.mockResolvedValue({ error: null });
  });

  it('saves the new password for the authenticated user', async () => {
    render(<ChangePasswordPage />);

    const password = 'new-password-123';
    fireEvent.change(await screen.findByLabelText('Nueva contraseña'), { target: { value: password } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña nueva'), { target: { value: password } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña nueva' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Tu contraseña se cambió correctamente.');
    expect(updateUserMock).toHaveBeenCalledWith({ password });
  });
});