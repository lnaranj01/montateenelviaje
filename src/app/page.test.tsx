import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'test-user', app_metadata: { role: 'admin' } } }, error: null }),
      signOut: async () => ({ error: null }),
    },
  }),
}));

describe('Home page', () => {
  it('renders the authenticated home page', async () => {
    render(<Home />);

    expect(await screen.findByRole('heading', { name: /Bienvenido a tu próximo viaje/i })).toBeInTheDocument();
    expect(screen.getByText(/Montate en el viaje/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Usuarios' })).toHaveAttribute('href', '/admin/usuarios');
  });
});
