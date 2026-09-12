import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home page', () => {
  it('renders the app branding headline', () => {
    render(<Home />);

    expect(screen.getByText(/Hola mundo desde la base del proyecto/i)).toBeInTheDocument();
    expect(screen.getByText(/Montate en el viaje/i)).toBeInTheDocument();
  });
});
