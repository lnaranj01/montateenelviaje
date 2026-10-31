# Estado de ejecución · Organizador de Viajes

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | Correcto (`npm.cmd run build`) | No ejecutados (P00 no los requiere) | 2026-10-31 |
| P01 Base de datos | completado | Correcto (`npm.cmd run build`) | Correcto (`npm.cmd run db:verificar`; 0 fallas) | 2026-10-31 |
| P02 Reglas de negocio | completado | Correcto (`npm.cmd run build`) | Correcto (28 pruebas en 9 archivos; 18 nuevas) | 2026-10-31 |
| P03 Servidor | completado | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (28 pruebas; endpoint 401 sin sesión y 200 con sesión) | 2026-10-31 |
| P04 Datos | completado | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (29 pruebas unitarias; flujo BD 14 OK, 0 fallas) | 2026-10-31 |
| P05 API | pendiente | | | |
| P06 Interfaz base y lista | pendiente | | | |
| P07 Formulario, editar, eliminar, completar y aceptación | pendiente | | | |
| P08 Opcional: filtros y resumen | pendiente | | | |

## Bitácora

### P00 · Auditoría del repositorio y archivos de control

- **Archivos creados:** `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`.
- **Archivos modificados:** ninguno.
- **Comandos y resultados:**
  - `npm run build`: bloqueado por la política de PowerShell al intentar cargar `npm.ps1`; no llegó a ejecutar el build.
  - `npm.cmd run build`: correcto; Next.js 16.3.5 compiló, completó TypeScript, generó páginas y optimizó la aplicación.
  - `node .\node_modules\next\dist\bin\next dev --hostname 127.0.0.1 --port 3000`: servidor local iniciado correctamente en `http://127.0.0.1:3000`.
  - `Invoke-WebRequest http://127.0.0.1:3000/login`: respondió HTTP 200.
  - Consulta PostgreSQL de solo lectura para `public.viajes`: el primer intento falló (`SELF_SIGNED_CERT_IN_CHAIN`). Tras descargar el certificado raíz desde Supabase Database Settings > SSL Configuration, se volvió a consultar con `rejectUnauthorized: true`: `public.viajes` no existe.
  - Se verificó el tipo de endpoint por host y puerto, sin imprimir credenciales: `POSTGRES_URL_NON_POOLING` usa el pooler de sesión (5432), y `POSTGRES_URL`/`POSTGRES_PRISMA_URL` usan el pooler de transacción (6543); no se identificó una conexión directa.
- **Problemas y resolución:** se usó `npm.cmd` para superar el bloqueo local de PowerShell. El certificado raíz de Supabase permitió consultar el esquema manteniendo la validación TLS; la tabla `public.viajes` no existe, que es lo esperado antes de P01. Se corrigió la descripción inicial: el nombre `POSTGRES_URL_NON_POOLING` no significa que el endpoint actual sea directo.
- **Pendientes al cierre de P00:** P01 debía comprobar/aplicar la tabla; quedó completado en la sección siguiente usando TLS verificado.

### P01 · Base de datos del módulo

- **Archivos creados:** `supabase/migrations/20261031000000_viajes_tabla.sql`, `scripts/db-client.mjs`, `scripts/migrar.mjs`, `scripts/verificar-bd.mjs`, `doc/checkpoints/FASE_1_COMPLETADA.md`.
- **Archivos modificados:** `package.json`, `doc/ESTADO_ACTUAL.md`, `doc/ESTADO_EJECUCION.md`.
- **Base de datos:** la migración de perfiles `20261003000000_create_profiles.sql` ya estaba aplicada; se confirmó por sus columnas, RLS, políticas y trigger, y se registró en `_migrations` sin reejecutarla. Se aplicó `20261031000000_viajes_tabla.sql` en una transacción.
- **Comandos y resultados:**
  - `$env:PGSSLROOTCERT='C:\Users\Estudiantes\Downloads\prod-ca-2021.crt'; npm.cmd run db:migrar`: perfiles omitidos por ya aplicados; migración de viajes aplicada.
  - `$env:PGSSLROOTCERT='C:\Users\Estudiantes\Downloads\prod-ca-2021.crt'; npm.cmd run db:verificar`: 0 fallas. Tabla existente, 0 filas, tres CHECK presentes, RLS activo, sin políticas públicas, permisos de lectura revocados, y cinco casos de integridad correctos; la transacción terminó con `ROLLBACK`.
  - Segunda ejecución de `npm.cmd run db:migrar`: omitió ambas migraciones por estar registradas; `npm.cmd run db:verificar` volvió a terminar con 0 fallas y 0 filas.
  - `npm.cmd run build`: correcto.
  - `node --check` sobre los scripts de conexión, migración y verificación: correcto.
- **Problemas y resolución:** se usó el certificado raíz de Supabase a través de `PGSSLROOTCERT`, con validación de servidor activada (`rejectUnauthorized: true`). No se desactivó TLS ni se almacenó el certificado en el repositorio. La conexión usa el endpoint configurado `POSTGRES_URL_NON_POOLING` (pooler de sesión).
- **Pendientes:** no hay pendientes para P01. El checkpoint contiene la salida íntegra del verificador.

### P02 · Reglas de negocio y pruebas unitarias

- **Archivos creados:** `src/lib/config/viajes.ts`, `src/lib/reglas/errores.ts`, `src/lib/reglas/fechas.ts`, `src/lib/reglas/viaje.ts`, `tests/reglas/ayudas.ts`, `tests/reglas/fechas.test.ts`, `tests/reglas/viaje.test.ts`, `doc/checkpoints/FASE_2_COMPLETADA.md`.
- **Archivos modificados:** `package.json` (script `test:ver`), `vitest.config.ts` (proyecto Node para reglas y jsdom para preservar las pruebas existentes), `doc/ESTADO_ACTUAL.md`, `doc/ESTADO_EJECUCION.md`.
- **Comandos y resultados:**
  - `npm.cmd test -- --reporter=dot`: 9 archivos y 28 pruebas pasaron; incluye los 18 casos T-01 a T-18 y las 10 pruebas preexistentes.
  - `npm.cmd run build`: correcto después de ajustar los accesos a índices requeridos por `noUncheckedIndexedAccess`.
  - `git diff --check`: correcto.
- **Problemas y resolución:** la configuración anterior solo incluía `src/` y usaba jsdom. Vitest quedó configurado con Node para las reglas y un proyecto jsdom para la suite preexistente. Una primera configuración ejecutó dos veces los casos de reglas; se eliminó el proyecto duplicado y la suite final pasó una sola vez. El primer build reportó índices posiblemente indefinidos al descomponer fechas; se añadieron guardas y el build posterior pasó.
- **Pendientes:** ninguno para P02. Las pruebas nuevas cubren exactamente T-01 a T-18; el checkpoint contiene el resumen de ejecución.

### P03 · Infraestructura del servidor

- **Archivos creados:** `src/lib/db/conexion.ts`, `src/lib/auth/sesion.ts`, `src/lib/deviceId.ts`, `src/lib/hooks/useDeviceId.ts`, `src/lib/http/respuestas.ts`, `src/lib/validacion/esquemas.ts`, `src/lib/formato.ts`, `src/app/api/viajes/sesion/route.ts`, `doc/checkpoints/FASE_3_COMPLETADA.md`.
- **Archivos modificados:** `src/proxy.ts`, `src/app/login/page.tsx`, `package.json`, `package-lock.json`.
- **Comandos y resultados:**
  - `npm.cmd test`: 9 archivos y 28 pruebas pasaron.
  - `npm.cmd run build`: correcto; Next.js compiló, validó TypeScript y generó `/api/viajes/sesion`.
  - `npm.cmd run type-check`: correcto.
  - ESLint enfocado sobre los módulos nuevos: correcto. El lint del archivo de login también detecta una regla preexistente `react-hooks/set-state-in-effect` en el aviso de recuperación, fuera del cambio solicitado.
  - Verificación local sin sesión: `GET /api/viajes/sesion` responde 401 con `NO_AUTORIZADO` y `Cache-Control: no-store`; `/viajes` redirige a `/login`; `/login` responde 200.
  - Verificación con sesión en el navegador local: `GET /api/viajes/sesion` responde 200 con el correo de la sesión.
- **Protección y login:** el proxy conserva la renovación de cookies, redirige páginas `/viajes/*` sin sesión y responde 401 JSON a `/api/viajes/*`. Las dos redirecciones posteriores al login ahora apuntan a `/viajes`.
- **Nota UX:** `/viajes` responde 404 con sesión hasta implementar su interfaz en P06; es temporal y esperado en P03. El endpoint de aceptación es `/api/viajes/sesion`.
- **Dependencia:** se añadió `@types/pg` para que TypeScript pueda comprobar la integración existente con `pg`.
- **Pendientes:** ninguno para P03. La conexión Postgres mantiene `rejectUnauthorized: true`; cuando se requiera el certificado raíz local, se proporciona mediante `PGSSLROOTCERT`, sin copiar credenciales o certificados al repositorio.

### P04 · Datos: viajes

- **Archivos creados:** `src/lib/datos/tipos.ts`, `src/lib/datos/viajes.ts`, `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts`, `scripts/cargar-demo.ts`, `scripts/tsconfig.scripts.json`, `scripts/server-only.ts`, `doc/checkpoints/FASE_4_COMPLETADA.md`.
- **Archivos modificados:** `src/lib/dataService.ts` (conserva sus exports de recuperación de contraseña y añade la fachada de viajes), `src/lib/reglas/viaje.ts` (también rechaza destinos mayores a 160 caracteres), `src/lib/db/conexion.ts` (rechaza conversiones BIGINT fuera del rango seguro), `tests/reglas/viaje.test.ts`, `package.json`, `package-lock.json`, `doc/ESTADO_ACTUAL.md`, `doc/ESTADO_EJECUCION.md`.
- **Capa de datos:** listar (filtro opcional de estado, orden reciente/inicio y límite 500), contar, obtener por dispositivo e id, crear Planeado, editar, eliminar, alternar estado y resumir. Todas las consultas usan parámetros y filtran por `device_id`; el cambio de estado es una actualización atómica.
- **Scripts:** `db:limpiar` acepta `--prueba` y `--demo`; `probar:flujo` usa exclusivamente `dataService`, limpia ambos dispositivos antes/después y cierra el pool; `db:demo` reemplaza la muestra del dispositivo `dev-demo-0001`.
- **Comandos y resultados:**
  - `$env:PGSSLROOTCERT='C:\Users\Estudiantes\Downloads\prod-ca-2021.crt'; npm.cmd run probar:flujo`: 14 pasos `OK`, 0 fallas; incluye aislamiento del dispositivo, fechas y validación. Los registros de `dev-test-*` se limpiaron al finalizar.
  - `npm.cmd run db:demo`: generó e imprimió 5 viajes (Cartagena, Medellín, Eje Cafetero, San Andrés y Bogotá), con Medellín y San Andrés completados.
  - `npm.cmd run db:limpiar -- --prueba`: 0 filas de prueba residuales.
  - `npm.cmd run db:verificar`: 0 fallas; tabla, checks, RLS, permisos e integridad correctos; la transacción de verificación terminó en `ROLLBACK`.
  - `npm.cmd test`: 9 archivos, 29 pruebas correctas (incluye el límite de 160 caracteres).
  - `npm.cmd run type-check`: correcto después de finalizar el build.
  - `npm.cmd run build`: correcto.
  - ESLint enfocado y `git diff --check`: correctos.
- **TLS y muestras:** las pruebas reales usaron el certificado externo por `PGSSLROOTCERT` y mantuvieron `rejectUnauthorized: true`. Los cinco ejemplos permanecen aislados en `dev-demo-0001`; pueden borrarse con `npm.cmd run db:limpiar -- --demo`.
- **Pendientes:** P04 completo. La fase 4 sigue abierta hasta P05 (API).
