# Estado actual del repositorio

Auditoría P00 · 31 de octubre de 2026. Se registran nombres de variables, nunca sus valores.

## 1. Versiones

Versiones declaradas en `package.json`:

| Paquete | Versión declarada |
|---|---|
| next | `16.3.5` |
| react | `19.2.8` |
| typescript | `^5` |
| tailwindcss | `^4` |
| pg | `^8.23.1` (en `devDependencies`) |
| zod | `^4.6.2` |
| @supabase/supabase-js | `^2.117.2` |
| vitest | `^5.0.0` |
| tsx | `^4.23.15` (en `devDependencies`) |

## 2. Scripts de `package.json`

| Script | Comando |
|---|---|
| `dev` | `node scripts/tokenVercel.mjs && next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint . --ext .ts,.tsx` |
| `format` | `prettier --write "src/**/*.{ts,tsx,css}"` |
| `type-check` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:ver` | `vitest` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `db:migrar` | `node scripts/migrar.mjs` |
| `db:verificar` | `node scripts/verificar-bd.mjs` |
| `db:limpiar` | `node scripts/limpiar-prueba.mjs` |
| `probar:flujo` | `tsx --tsconfig scripts/tsconfig.scripts.json --env-file=.env.local scripts/probar-flujo.ts` |
| `db:demo` | `tsx --tsconfig scripts/tsconfig.scripts.json --env-file=.env.local scripts/cargar-demo.ts` |

`node_modules/` existe. El script `dev` intenta renovar `VERCEL_OIDC_TOKEN` desde Vercel y escribirlo en `.env.local`; para la prueba local de P00 se inició Next directamente. Los scripts de base usan `PGSSLROOTCERT` (si se define) para verificar el certificado TLS de PostgreSQL.

## 3. Estructura existente

El proyecto utiliza `src/`; los componentes reutilizables están en `src/components/ui/` y los componentes de viajes en `src/components/viajes/`.

```text
src/
├── app/
│   ├── admin/usuarios/{page.tsx, user-manager.tsx}
│   ├── api/
│   │   ├── admin/{access,users}/route.ts
│   │   ├── auth/{recuperar,restablecer}/route.ts
│   │   ├── viajes/{route.ts,sesion/route.ts,resumen/route.ts}
│   │   ├── viajes/[id]/{route.ts,completar/route.ts}
│   │   ├── correo/prueba/route.ts
│   │   └── health/route.ts
│   ├── cuenta/contrasena/page.tsx
│   ├── login/page.tsx
│   ├── prueba-correo/{page.tsx, formulario.tsx}
│   ├── recuperar-contrasena/page.tsx
│   ├── registro/page.tsx
│   ├── restablecer-contrasena/{page.tsx, formulario.tsx}
│   ├── {layout.tsx, page.tsx, globals.css}
│   └── pruebas existentes junto a varias páginas y rutas
├── lib/
│   ├── auth/admin.ts
│   ├── config/viajes.ts
│   ├── datos/{tipos,viajes}.ts
│   ├── db/conexion.ts
│   ├── reglas/{errores,fechas,viaje}.ts
│   ├── supabase/{admin,client,config,server}.ts
│   └── {correo,dataService,json-store,plantillasCorreo,tokenRecuperacion,urlBase}.ts
├── proxy.ts
└── test/setup.ts

tests/
└── reglas/{ayudas.ts,fechas.test.ts,viaje.test.ts}

supabase/
├── migrations/
│   ├── 20261003000000_create_profiles.sql
│   └── 20261031000000_viajes_tabla.sql
└── restablecimientos_contrasena.sql

scripts/
├── db-client.mjs
├── migrar.mjs
├── verificar-bd.mjs
├── apply-profiles-migration.mjs
├── cargar-demo.ts
├── limpiar-prueba.mjs
├── probar-flujo.ts
├── server-only.ts
├── tsconfig.scripts.json
└── tokenVercel.mjs
```

La estructura real usa `src/app/` y `src/lib/`, no `app/` ni `lib/` en la raíz.

## 4. Alias de importación

Definidos en `tsconfig.json`:

- `@/*` → `./src/*`
- `@data/*` → `./data/*`

El prefijo para importar desde `src/lib/` es `@/lib/...`.

## 5. Autenticación

- Implementación: Supabase Auth con correo y contraseña. `@supabase/ssr` crea clientes de navegador y servidor; la sesión se conserva en cookies.
- Archivos principales: `src/lib/supabase/{client,server,config,admin}.ts`, `src/lib/auth/{admin,sesion}.ts`, `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/viajes/layout.tsx` y `src/proxy.ts`.
- `obtenerSesion()` centraliza la lectura de la sesión en servidor; `getAdminContext()` devuelve un contexto administrativo o un estado 401/403/503.
- Login: `/login` (`src/app/login/page.tsx`).
- Después de iniciar sesión se navega a `/viajes` (`src/app/login/page.tsx`), ahora protegida por su layout de servidor.
- Cierre de sesión: `src/app/page.tsx`, `handleSignOut()` llama `auth.signOut()` y, si no hay error, navega a `/login` (líneas 58-62).
- Protección/actualización de sesión: `src/proxy.ts` ejecuta `supabase.auth.getClaims()`, actualiza cookies y protege `/viajes/*` y `/api/viajes/*`. La API sin sesión responde 401 en JSON.
- El proyecto actual también tiene registro y páginas administrativas con comprobación del rol `admin`; el módulo nuevo no debe reescribir estas funciones.

## 6. Acceso a datos

- Clientes Supabase existentes: cliente de navegador (`createBrowserClient`), servidor (`createServerClient`) y administrador (`createClient` de `@supabase/supabase-js`).
- `pg` está declarado en `devDependencies`; `scripts/apply-profiles-migration.mjs` lo usa mediante `Client`, y la aplicación usa el pool TLS de `src/lib/db/conexion.ts`.
- `scripts/db-client.mjs` comparte el cliente `pg` de los scripts de migración/verificación. La conexión se selecciona entre las URLs `POSTGRES_*` y verifica TLS.
- `src/lib/dataService.ts` conserva las operaciones de recuperación de contraseña y agrega la fachada pública de viajes implementada en `src/lib/datos/viajes.ts`. Todas las operaciones de datos filtran por `device_id`.

## 7. Migraciones

- Carpeta: `supabase/migrations/`.
- Migración versionada presente: `20261003000000_create_profiles.sql`.
- Migración de viajes aplicada: `20261031000000_viajes_tabla.sql`.
- SQL adicional: `supabase/restablecimientos_contrasena.sql`.
- `scripts/apply-profiles-migration.mjs` ejecuta explícitamente la migración de perfiles y verifica la tabla y sus políticas. No es un ejecutor genérico ni usa una tabla de control `_migrations`.
- `scripts/migrar.mjs` mantiene la tabla de control `public._migrations`, aplica migraciones SQL en orden alfabético dentro de transacciones y registra la migración de perfiles ya aplicada sin reejecutarla.
- La conexión/migración de perfiles usa URLs `POSTGRES_*`; los scripts nuevos admiten `PGSSLROOTCERT` y mantienen `rejectUnauthorized: true`.
- Nombre exacto de M1: `20261031000000_viajes_tabla.sql`.

## 8. Variables de entorno

`.env.local` existe. `.env.example` no existe. Solo se registran los nombres:

```text
NEXT_PUBLIC_MONTATEENELVIAJESUPABASE_ANON_KEY
NEXT_PUBLIC_MONTATEENELVIAJESUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_MONTATEENELVIAJESUPABASE_URL
POSTGRES_DATABASE
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_PRISMA_URL
POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
SUPABASE_ANON_KEY
SUPABASE_JWT_SECRET
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
VERCEL_OIDC_TOKEN
```

Hay tres URLs PostgreSQL. Aunque la variable `POSTGRES_URL_NON_POOLING` se llame así, su host es `aws-0-us-east-1.pooler.supabase.com` y su puerto es 5432: corresponde al pooler compartido en modo sesión, no a una conexión directa. `POSTGRES_URL` usa el mismo host por el puerto 6543 (pooler compartido en modo transacción). `POSTGRES_PRISMA_URL` también usa el puerto 6543. `DATABASE_URL` no figura entre los nombres. Inicialmente la verificación falló con `SELF_SIGNED_CERT_IN_CHAIN`; se descargó el certificado raíz desde Supabase Database Settings > SSL Configuration y las consultas posteriores se hicieron con verificación TLS activa (`rejectUnauthorized: true`). La tabla `public.viajes` se creó durante P01. El certificado está localmente fuera del repositorio; no se modificó `.env.local` ni se copió el certificado al repositorio.

## 9. Estilos

- Tailwind CSS `^4`; `src/app/globals.css` importa `tailwindcss` y define `--color-background` y `--color-foreground` en `@theme inline`.
- Fuentes: Geist y Geist Mono mediante `next/font/google` en `src/app/layout.tsx`; el `body` también declara Arial/Helvetica en CSS.
- Tokens actuales: claro `#ffffff`/`#171717`; en modo oscuro `#0a0a0a`/`#ededed`. No están declarados los tokens de la paleta de viajes del plan.
- No se encontró una librería de íconos declarada en `package.json`.

## 10. Pruebas

Vitest `^5.0.0` (`vitest.config.ts`). El proyecto raíz ejecuta pruebas en Node desde `tests/**/*.test.ts`; un proyecto adicional conserva `jsdom` y ejecuta las pruebas existentes en `src/`. En P02 pasaron 18 pruebas nuevas T-01 a T-18 y las 10 pruebas existentes (28 en total).

## 11. Conflictos con el plan

| Elemento | Estado actual |
|---|---|
| `app/viajes` | `src/app/viajes/layout.tsx` protege la ruta y muestra navegación/cierre de sesión; `src/app/viajes/page.tsx` integra el formulario, contador, lista y acciones CRUD. |
| `app/api/viajes` | Hay rutas protegidas para sesión, listado/creación, detalle/edición/eliminación, alternancia de estado y resumen. |
| `lib/dataService.ts` | Conserva las operaciones de recuperación de contraseña y exporta la fachada de datos de viajes. |
| `components/ui` | Componentes reutilizables en `src/components/ui/`: `Boton`, `Campo`, `Tarjeta`, `Insignia`, `Aviso`, `Modal` y `EstadoVacio`. |
| `src/app/page.tsx` | Landing protegida en cliente: comprueba usuario, envía al login si no hay sesión, ofrece funciones de la aplicación, cierre de sesión y enlace a `/viajes`; el enlace administrativo depende del rol. |
| `src/components/viajes` | Navegación autenticada, formulario de crear/editar, contador, tarjetas con completar/reactivar y eliminación confirmada, insignia de estado y lista cliente con carga/error/estado vacío. |
| `doc/ACEPTACION.md` | Casos A-01 a A-15 documentados; A-01 a A-14 pendientes de ejecución en el despliegue de Vercel y A-15 pendiente de P08. |
| Tabla `public.viajes` | Existe con columnas `id UUID`, `device_id VARCHAR(64)`, `destino VARCHAR(160)`, `fecha_inicio DATE`, `fecha_fin DATE`, `presupuesto INTEGER`, `completado BOOLEAN`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`. Tiene las tres restricciones del plan, RLS activo, cero políticas y permisos revocados a `anon`/`authenticated`. P04 deja cinco viajes demo aislados bajo `device_id = dev-demo-0001`; `npm run db:limpiar -- --demo` los elimina. |

## 12. Decisiones derivadas

- Ruta de login: `/login` (`src/app/login/page.tsx`).
- Protección de sesión: `src/proxy.ts` existe y es el formato de Next.js 16; su matcher se documenta en la sección 5. Actualmente renueva/verifica claims, pero no bloquea rutas de viajes.
- Migraciones: `npm run db:migrar`, con tabla de control `public._migrations`. M1 y su verificación quedaron completadas en P01.
- Variable disponible para `conexion.ts`: `POSTGRES_URL_NON_POOLING`, que está presente en `.env.local`, pero apunta al pooler de sesión (puerto 5432), no a una conexión directa. No copiar su valor a documentación ni al repositorio.
- Nombre de M1: `20261031000000_viajes_tabla.sql`; aplicada y verificada.
- Prefijo de imports para `lib`: `@/lib/`.
- Puerta de login existente: Supabase Auth por correo/contraseña; conservar el login y sus funciones administrativas.

## 13. Compilación de base

`npm run build` no pudo invocarse directamente desde PowerShell porque la política de ejecución bloquea `npm.ps1`. El equivalente `npm.cmd run build` terminó correctamente el 31 de octubre de 2026: compilación de Next.js, TypeScript, generación de páginas y optimización sin errores. Se generaron las rutas existentes; no hay rutas de viajes todavía.
