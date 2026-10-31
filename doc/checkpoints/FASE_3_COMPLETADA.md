# Fase 3 · Infraestructura del servidor completada

Fecha de cierre: 2026-10-31.

## Infraestructura

- `src/lib/db/conexion.ts` crea y reutiliza un pool PostgreSQL, conserva los tipos de fechas y contadores del plan, y usa `POSTGRES_URL_NON_POOLING` (con fallback a las otras variables `POSTGRES_*`). TLS exige validación del certificado; `PGSSLROOTCERT` permite indicar el certificado raíz local sin almacenarlo en el repositorio.
- `src/lib/auth/sesion.ts` implementa `obtenerSesion()` y `exigirSesion()` con el cliente de servidor Supabase existente.
- `src/lib/deviceId.ts` y `src/lib/hooks/useDeviceId.ts` conservan el UUID en localStorage y mantienen `null` durante SSR.
- `src/lib/http/respuestas.ts`, `src/lib/validacion/esquemas.ts` y `src/lib/formato.ts` implementan los contratos de respuesta, validación y formato del plan.
- `src/app/api/viajes/sesion/route.ts` expone el correo de la sesión con respuesta `no-store`.

## Protección y login

- `src/proxy.ts` añade `/viajes/:path*` y `/api/viajes/:path*` al matcher, conserva la renovación de sesión y protege ambos grupos de rutas.
- Sin sesión, las páginas de viajes redirigen a `/login` y la API devuelve HTTP 401 en el formato estándar.
- El login ahora redirige a `/viajes`. La ruta de pantalla aún no existe y mostrará 404 hasta P06; es el comportamiento temporal previsto por P03.

## Verificación

- `npm.cmd test`: 9 archivos, 28 pruebas correctas.
- `npm.cmd run type-check`: correcto.
- `npm.cmd run build`: correcto; Next.js generó `/api/viajes/sesion`.
- ESLint enfocado en los módulos nuevos: correcto. En el archivo de login existe un diagnóstico previo de `react-hooks/set-state-in-effect` en el aviso de recuperación, no relacionado con el cambio de destino.
- Sin sesión: `GET /api/viajes/sesion` devuelve HTTP 401, `NO_AUTORIZADO`, `Cache-Control: no-store`.
- Sin sesión: `/viajes` redirige a `/login`; `/login` responde HTTP 200.
- Con sesión iniciada en el navegador local: `GET /api/viajes/sesion` devuelve HTTP 200 con `{ "ok": true, "datos": { "email": "…" } }`.

## Resumen de cambios

Se agregaron las utilidades de conexión, sesión, device ID, respuestas HTTP, esquemas, formatos y el endpoint de sesión. El proxy protege las rutas de viajes y el login redirige a `/viajes`. Se agregó `@types/pg` para mantener el chequeo estricto de TypeScript.
