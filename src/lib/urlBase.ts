function normalizarDominio(dominio: string): string {
  return dominio.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

export function obtenerUrlBase(): string {
  const urlConfigurada = process.env.APP_URL?.trim().replace(/\/+$/, '');

  if (urlConfigurada) {
    return urlConfigurada;
  }

  const urlProduccion = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (process.env.VERCEL_ENV === 'production' && urlProduccion) {
    return `https://${normalizarDominio(urlProduccion)}`;
  }

  const urlVercel = process.env.VERCEL_URL?.trim();
  if (urlVercel) {
    return `https://${normalizarDominio(urlVercel)}`;
  }

  return 'http://localhost:3000';
}