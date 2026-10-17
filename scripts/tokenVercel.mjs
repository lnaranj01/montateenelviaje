import { spawn } from 'node:child_process';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const aviso = 'Aviso: no se pudo renovar la conexión con Vercel. El envío de correos no funcionará en local.';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaTemporal = path.join(raiz, '.env.vercel.local');
const rutaEntorno = path.join(raiz, '.env.local');
let fallo = false;

try {
  await new Promise((resolver, rechazar) => {
    const proceso = spawn('npx vercel env pull .env.vercel.local --yes', {
      cwd: raiz,
      shell: true,
      stdio: 'ignore',
      windowsHide: true,
    });

    proceso.once('error', rechazar);
    proceso.once('close', (codigo) => {
      if (codigo === 0) {
        resolver();
      } else {
        rechazar(new Error('Falló la descarga de variables de Vercel.'));
      }
    });
  });

  const contenidoTemporal = await readFile(rutaTemporal, 'utf8');
  const lineaToken = contenidoTemporal.split(/\r?\n/).find((linea) => /^\s*VERCEL_OIDC_TOKEN\s*=/.test(linea));

  if (!lineaToken || !/^\s*VERCEL_OIDC_TOKEN\s*=\s*\S/.test(lineaToken)) {
    throw new Error('El archivo de Vercel no contiene VERCEL_OIDC_TOKEN.');
  }

  const contenidoLocal = await readFile(rutaEntorno, 'utf8');
  const patronToken = /^[ \t]*VERCEL_OIDC_TOKEN[ \t]*=[^\r\n]*(?=\r?$)/gm;
  let contenidoActualizado;

  if (patronToken.test(contenidoLocal)) {
    contenidoActualizado = contenidoLocal.replace(patronToken, lineaToken);
  } else {
    const separador = contenidoLocal.match(/\r\n|\n|\r/)?.[0] ?? '\n';
    const necesitaSeparador = contenidoLocal.length > 0 && !/(?:\r\n|\n|\r)$/.test(contenidoLocal);
    contenidoActualizado = `${contenidoLocal}${necesitaSeparador ? separador : ''}${lineaToken}`;
  }

  await writeFile(rutaEntorno, contenidoActualizado, 'utf8');
} catch {
  fallo = true;
} finally {
  try {
    await unlink(rutaTemporal);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      fallo = true;
    }
  }
}

if (fallo) {
  console.warn(aviso);
}