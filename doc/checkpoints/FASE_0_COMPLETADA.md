# Fase 0 · Auditoría completada

Fecha de cierre: 2026-10-31.

## Resultado de compilación

`npm.cmd run build`: correcto. Next.js 16.3.5 completó la compilación, TypeScript, generación de páginas y optimización. Se usó `npm.cmd` porque PowerShell bloquea la ejecución de `npm.ps1`.

## Conexión a PostgreSQL

Existe la variable `POSTGRES_URL_NON_POOLING` en `.env.local` (también están `POSTGRES_URL` y `POSTGRES_PRISMA_URL`). No se copió ningún valor. El host y puerto indican que `POSTGRES_URL_NON_POOLING` usa el pooler de sesión (5432), mientras que las otras URLs usan el pooler de transacción (6543); no se identificó un endpoint directo. Tras obtener el certificado raíz de Supabase y mantener la verificación TLS activa, la consulta de solo lectura confirmó que `public.viajes` no existe todavía.

## Mecanismo de login

Supabase Auth con correo y contraseña, usando `@supabase/ssr`. El cliente obtiene al usuario con `auth.getUser()`. El login vive en `/login`; al autenticarse navega a `/`, y la página raíz comprueba la sesión. `src/proxy.ts` ejecuta `getClaims()` para actualizar/verificar cookies, pero no aplica actualmente un bloqueo específico a rutas de viajes. El cierre de sesión llama `auth.signOut()` y redirige a `/login`.

## Decisiones derivadas

- Protección de sesión existente: `src/proxy.ts` (Next.js 16); conserva el login actual.
- Variable disponible para la conexión de `pg`: `POSTGRES_URL_NON_POOLING` (pooler de sesión, no conexión directa).
- Nombre propuesto de M1: `20261031000000_viajes_tabla.sql`, siguiendo el formato timestamp de la migración existente.
- Prefijo de importación para `src/lib/`: `@/lib/`.
- `app/viajes`, `app/api/viajes` y `components/ui` aún no existen. `src/lib/dataService.ts` ya existe, pero gestiona recuperación de contraseña.

## Resultado posterior de P01

La fase siguiente aplicó `20261031000000_viajes_tabla.sql`; `public.viajes` ya existe con RLS activo y sus restricciones verificadas. La tabla de control `public._migrations` registró la migración de perfiles preexistente sin reejecutarla. Ver [FASE_1_COMPLETADA.md](./FASE_1_COMPLETADA.md) para el resultado completo.
