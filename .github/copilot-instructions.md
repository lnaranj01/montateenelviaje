# Organizador de Viajes · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: `doc/PLAN_VIAJES.md`. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: `doc/ESTADO_ACTUAL.md`.
- Avance: `doc/ESTADO_EJECUCION.md`. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete `pg` y la variable `POSTGRES_URL_NON_POOLING` (en este entorno apunta al pooler de sesión, no a una conexión directa). Los scripts de base usan `PGSSLROOTCERT` si hace falta confiar en el certificado raíz; no se desactiva la verificación TLS.
- Validación con Zod. Pruebas con Vitest.
- Login existente: Supabase Auth con correo y contraseña (`@supabase/ssr`); se conserva sin reescribir. La aplicación existente también tiene funciones administrativas; los viajes se agrupan por `device_id`.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español (el plan pide código comentado en español).
- Reglas de negocio solo en `lib/reglas/`: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto `fechas.ts`). Se prueban con Vitest.
- Solo `lib/datos/` importa `lib/db/conexion.ts`. Rutas y páginas importan datos únicamente desde `lib/dataService.ts`.
- Toda ruta en `app/api/viajes/` llama `await exigirSesion()` como primera instrucción, y toda operación filtra por `device_id`.
- Entradas validadas con los esquemas de `lib/validacion/esquemas.ts`.
- Errores de negocio con `ErrorDeNegocio(codigo)`; respuestas con `lib/http/respuestas.ts`.
- El presupuesto es un entero en pesos. Nunca decimales ni string.
- Fechas `YYYY-MM-DD` como texto entre capas. La fecha de fin no puede ser anterior a la de inicio.
- En rutas dinámicas `params` es una Promise: `const { id } = await params`.
- SQL siempre con parámetros (`$1`, `$2`). Nunca concatenar valores.
- Eliminar un viaje exige confirmación en la interfaz. Un viaje nuevo nace "Planeado".
- No instalar librerías de componentes (shadcn, MUI u otras). Usar `components/ui/`.
- Prefijo de imports para lib: `@/lib/`.
- Archivo de protección de rutas: `src/proxy.ts`. Ruta de login: `/login` (`src/app/login/page.tsx`).

## Al terminar cada tarea
1. `npm run build` sin errores.
2. `npm test` sin fallas (desde que exista Vitest).
3. Actualizar `doc/ESTADO_EJECUCION.md`.
4. No hacer commit: el estudiante revisa y hace el commit.
