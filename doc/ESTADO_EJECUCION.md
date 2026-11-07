# Estado de ejecución · Organizador de Viajes

| Prompt                                                   | Estado                            | Build                                                    | Tests                                                                                          | Fecha de cierre |
| -------------------------------------------------------- | --------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------- |
| P00 Auditoría                                            | completado                        | Correcto (`npm.cmd run build`)                           | No ejecutados (P00 no los requiere)                                                            | 2026-10-31      |
| P01 Base de datos                                        | completado                        | Correcto (`npm.cmd run build`)                           | Correcto (`npm.cmd run db:verificar`; 0 fallas)                                                | 2026-10-31      |
| P02 Reglas de negocio                                    | completado                        | Correcto (`npm.cmd run build`)                           | Correcto (28 pruebas en 9 archivos; 18 nuevas)                                                 | 2026-10-31      |
| P03 Servidor                                             | completado                        | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (28 pruebas; endpoint 401 sin sesión y 200 con sesión)                                | 2026-10-31      |
| P04 Datos                                                | completado                        | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (29 pruebas unitarias; flujo BD 14 OK, 0 fallas)                                      | 2026-10-31      |
| P05 API                                                  | completado                        | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (42 pruebas en 13 archivos; GET/POST 401 anónimos; CRUD autenticado y validación 422) | 2026-10-31      |
| P06 Interfaz base y lista                                | completado                        | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (45 pruebas en 14 archivos; 3 nuevas de lista)                                        | 2026-10-31      |
| P07 Formulario, editar, eliminar, completar y aceptación | completado                        | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (55 pruebas en 16 archivos; flujo BD 14 OK, 0 fallas)                                 | 2026-10-31      |
| P08 Opcional: filtros y resumen                          | completado                        | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (60 pruebas en 18 archivos; aceptación A-15 en Vercel)                                | 2026-11-07      |
| Planes demo guardados                                    | código listo; migración pendiente | Correcto (`npm.cmd run build`; `npm.cmd run type-check`) | Correcto (74 pruebas en 22 archivos; ESLint enfocado sin advertencias)                         | 2026-11-07      |

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

### P05 · API de viajes

- **Archivos creados:** `src/app/api/viajes/route.ts`, `src/app/api/viajes/[id]/route.ts`, `src/app/api/viajes/[id]/completar/route.ts`, `src/app/api/viajes/resumen/route.ts`, y pruebas para cada handler.
- **Archivos modificados:** `src/lib/validacion/esquemas.ts` (esquemas de `deviceId`, UUID de viaje y cuerpos), `src/lib/datos/tipos.ts` (tipos de filtros compatibles con `exactOptionalPropertyTypes`), `doc/ESTADO_ACTUAL.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_4_COMPLETADA.md`.
- **Rutas implementadas:** GET/POST `/api/viajes`; GET/PATCH/DELETE `/api/viajes/[id]`; PATCH `/api/viajes/[id]/completar`; GET `/api/viajes/resumen`. Todas son dinámicas, requieren sesión como primera instrucción, validan UUID/query/cuerpo con Zod, llaman la fachada `dataService` y devuelven el formato `no-store`.
- **Pruebas automatizadas:** 13 tests en cuatro archivos cubren creación 201, lista y filtros, esquema y UUID inválidos, params Promise, actualización, eliminación, alternancia, resumen, errores 404/422 y autorización antes de llamar a datos.
- **Verificación anónima local:** GET y POST `/api/viajes` respondieron HTTP 401 JSON antes de acceder a PostgreSQL.
- **Verificación autenticada en el navegador local:** POST creó con HTTP 201; GET lista y detalle, PATCH edición, PATCH completar, GET resumen y DELETE respondieron HTTP 200; el POST con fin anterior al inicio respondió HTTP 422 `FECHA_FIN_ANTERIOR`. El dispositivo UUID de aceptación quedó sin el viaje temporal.
- **Comandos y resultados:** `npm.cmd test` y `npm.cmd run build` correctos; `npm.cmd run type-check`, ESLint enfocado y `git diff --check` correctos.
- **Pendientes:** P05 completo; fase 4 cerrada. La siguiente fase es P06 (interfaz base y lista).

### P06 · Interfaz base, encabezado y lista de viajes

- **Archivos creados:** componentes UI reutilizables (`Boton`, `Campo`, `Tarjeta`, `Insignia`, `Aviso`, `Modal`, `EstadoVacio`), componentes de viajes para navegación, contador, tarjetas, estados y lista, además de `src/app/viajes/layout.tsx`, `src/app/viajes/page.tsx` y pruebas de la lista.
- **Archivos modificados:** tokens visuales de Tailwind 4 en `src/app/globals.css`, enlace al organizador en el landing existente y documentación de estado.
- **Experiencia implementada:** layout servidor protegido con `obtenerSesion()` y redirección al login, encabezado azul con correo y cierre de sesión, carga de viajes desde `/api/viajes?deviceId=...`, contador, tarjetas, mensaje vacío, estados de carga/error y reintento. Los controles de las tarjetas permanecen deshabilitados hasta P07.
- **Verificación local:** con sesión iniciada, `/viajes` mostró el encabezado, correo, contador en cero y el mensaje acordado de lista vacía. A 390 px no hubo desbordamiento horizontal; la vista conserva su composición móvil.
- **Pruebas automatizadas:** tres pruebas nuevas cubren lista vacía, representación de viaje y recuperación de error; `npm.cmd test`: 45 pruebas en 14 archivos correctas.
- **Comandos y resultados:** `npm.cmd run type-check`, `npm.cmd run build`, ESLint enfocado y `git diff --check`: correctos.
- **Pendientes:** P06 completo; continuar con P07 (formulario y acciones de viajes).

### P07 · Formulario, acciones y aceptación

- **Archivos creados:** `FormularioViaje` y sus pruebas, `respuestaApi.ts`, `doc/ACEPTACION.md`, `doc/checkpoints/FASE_5_COMPLETADA.md` y `doc/checkpoints/FASE_6_COMPLETADA.md`.
- **Archivos modificados:** formulario y lista de `/viajes`, acciones de tarjetas, accesibilidad del modal, `README.md`, `doc/ESTADO_ACTUAL.md` y este estado de ejecución.
- **Interfaz:** el formulario crea y edita en la misma página; la validación usa las reglas de negocio, muestra el error de fechas junto a la fecha de fin y envía el presupuesto como entero. Las acciones completar/reactivar refrescan la lista y el contador; eliminar requiere confirmar en el modal.
- **Auditoría según el plan:** las ocho operaciones de `/api/viajes/*` llaman `exigirSesion()`; las operaciones de datos filtran por `device_id`; no se encontraron fechas comparadas como objetos locales ni mensajes nuevos en inglés. No se agregaron comentarios de código innecesarios. `.env.local` está ignorado y no está versionado; la búsqueda de asignaciones no encontró credenciales en archivos versionados.
- **Prueba de datos:** `npm.cmd run probar:flujo`: 14 pasos `OK`, 0 fallas; `npm.cmd run db:limpiar -- --prueba`: 0 filas de prueba residuales.
- **Aceptación manual local:** se creó, editó, completó y reactivó un viaje; se canceló una eliminación (el registro permaneció) y luego se confirmó (contador volvió a cero).
- **Pruebas automatizadas:** `npm.cmd test`: 55 pruebas en 16 archivos correctas, incluidas validación decimal/negativa, errores de API, acciones de tarjeta y teclado/foco del modal.
- **Comandos y resultados:** `npm.cmd run build`, `npm.cmd run type-check`, ESLint enfocado y `git diff --check`: correctos.
- **Aceptación en Vercel:** A-01 a A-14 aprobadas en [producción](https://montateenelviaje.vercel.app); resultados y evidencias en [doc/ACEPTACION.md](./ACEPTACION.md). El primer intento detectó `SELF_SIGNED_CERT_IN_CHAIN` porque faltaba `PGSSLROOTCERT` en producción. Se configuró el certificado raíz de Supabase en Vercel y se redeplegó la versión actual, manteniendo `rejectUnauthorized: true`. Se verificaron la lista, las operaciones y la persistencia; al terminar, el contador quedó en 0 y no quedaron registros de prueba. A-15 se aprobó en P08.

### P08 · Filtros, orden y resumen

- **Archivos creados:** `FiltrosViajes`, `ResumenViajes`, el contenedor cliente de la página y sus pruebas; `doc/checkpoints/FASE_7_COMPLETADA.md`.
- **Archivos modificados:** la página `/viajes` ahora lee `searchParams` como Promise y normaliza estado/orden antes de pasar los filtros a la lista; la lista solicita el estado y orden seleccionados, conserva el contador global y explica cuántos resultados muestra; `README.md`, `doc/ACEPTACION.md` y este registro.
- **Interfaz:** filtros Todos/Planeado/Completado y Más reciente/Fecha de inicio, sincronizados con la URL; resumen con total, planeados, completados y suma de presupuestos en pesos. Los totales son globales por dispositivo, tal como define F7, y el resumen indica cuántos viajes corresponden al filtro actual.
- **Aceptación en Vercel:** A-15 aprobada en [producción](https://montateenelviaje.vercel.app). Con tres viajes de prueba (dos planeados y uno completado), el filtro Completado dejó visible solo el viaje completado y el resumen indicó un viaje en el filtro; el orden por fecha de inicio mostró 05/12, 10/12 y 20/12. El resumen global mostró total 3, planeados 2, completados 1 y presupuesto $600.000, suma comprobada manualmente. Se eliminaron los tres registros de aceptación; el contador final quedó en 0.
- **Pruebas automatizadas:** `npm.cmd test`: 60 pruebas en 18 archivos correctas. Las pruebas nuevas cubren actualización de URL, solicitud filtrada/ordenada, estado vacío y representación/error del resumen.
- **Comandos y resultados:** `npm.cmd run build`, `npm.cmd run type-check`, ESLint enfocado, Prettier enfocado y `git diff --check`: correctos.
- **Despliegue:** la implementación quedó lista en Vercel; no se modificaron las rutas API ni la lógica de datos existente.

### Iniciativa posterior · Compras y reservas de viaje

- **Solicitud:** permitir buscar y comprar vuelos, hospedaje, transporte, actividades y artículos esenciales desde la aplicación, con mercado inicial en Colombia y monto objetivo en COP para tarjetas nacionales e internacionales.
- **Decisión de producto:** iniciar el descubrimiento técnico/comercial por hospedaje y procurar un flujo de reserva integrado donde un socio autorizado lo permita; el proveedor gestiona el inventario y cumplimiento inicial. Vuelos, transporte, actividades y artículos se incorporan en etapas separadas; no se promete un carrito universal.
- **Documento:** el alcance, fases, moneda, seguridad, criterios de lanzamiento y dependencias están en [doc/PLAN_COMERCIO_VIAJES.md](./PLAN_COMERCIO_VIAJES.md). Se consultaron documentos oficiales de Booking.com y Mercado Pago.
- **Compras reales:** no hay acceso confirmado a socios, inventario ni credenciales sandbox/producción; no están implementadas ofertas, reservas o pagos reales. Próximo paso: tramitar acceso de socios y comprobar capacidades en sandbox antes de integrar, sin presentar ejemplos como ofertas reales.
- **Prototipo local:** `/demo-compras`, accesible desde el enlace **Armar viaje según presupuesto (demo)** de `/viajes` y sin exigir sesión, permite ingresar destino, fechas, presupuesto y viajeros; elegir ejemplos de vuelos, hospedaje, carro, tours y artículos esenciales; y ver el total, saldo o excedente. Los precios ilustrativos ahora se escalan según el presupuesto diario por viajero y duración; con COP 50 millones se muestran importes de muestra mayores que con COP 2 millones. Los servicios y precios siguen siendo ficticios: no hay disponibilidad, reservas, envío de datos a terceros ni cobros.
- **Interfaz:** se renovó el planificador con fondo azul noche, brillos azul/cian fluorescente, pasos y tarjetas con contraste mejorado, controles más claros y adaptación móvil.
- **Verificación del prototipo:** `npm.cmd test` (64 pruebas en 19 archivos), `npm.cmd run type-check`, `npm.cmd run build`, ESLint y Prettier correctos. El navegador local verificó el diseño en escritorio y móvil sin desbordamiento horizontal; con COP 50 millones, dos viajeros y tres días, los ejemplos muestran COP 15 millones para vuelos y COP 10 millones para hospedaje. No se inicia ninguna operación de compra.
- **Moneda:** COP es el monto objetivo del cobro; las redes/emisores convierten a la moneda de la tarjeta y sus tasas/comisiones y aceptación varían. No se promete “cualquier moneda”. Si el proveedor no confirma cobro final en COP, no continuar como si el requisito estuviera cumplido.

### Planes de ejemplo guardados en el organizador

- **Implementación:** el planificador comparte el catálogo y las reglas de cálculo entre cliente y servidor; permite guardar servicios elegidos y recalcula sus importes en el servidor. La API GET/POST exige sesión, valida la entrada y opera con el `device_id`; la página `/viajes` lista hasta 100 planes del dispositivo, con precios ilustrativos y etiqueta visible de “no comprado”.
- **Persistencia:** se añadió `supabase/migrations/20261107000000_planes_guardados.sql` y se documentó en el README. La migración no se ejecutó: la conexión local puede apuntar a una base compartida/de producción. Antes de probar persistencia, confirma el destino y aplica la migración en el entorno correcto.
- **Pruebas y compilación:** `npm.cmd test`: 74 pruebas en 22 archivos; `npm.cmd run type-check`, ESLint enfocado, `npm.cmd run build` y `git diff --check`: correctos. Las pruebas nuevas cubren cálculo, selección de servicios, protección/validación de API, guardado desde el planificador y presentación en `/viajes`; no prueban una base PostgreSQL real.
- **Compras reales:** estos registros son planes de ejemplo; no representan compras ni reservas y no procesan pagos.
