# Fase 4 · Datos de viajes completados

Fecha de cierre: 2026-10-31.

## Capa de datos

- `src/lib/datos/tipos.ts` define `Viaje`, `DatosViaje`, `ResumenViajes` y filtros.
- `src/lib/datos/viajes.ts` implementa listar, contar, obtener, crear, editar, eliminar, alternar completado y resumen.
- Cada operación SQL está parametrizada y acotada al `device_id`. Listados respetan el límite `LIMITE_LISTADO` (500); el cambio de estado usa un `UPDATE ... NOT` atómico.
- Los datos se validan con `validarViaje`, destino recortado al guardar, y errores `23514` se traducen a errores de negocio según la restricción.
- `src/lib/dataService.ts` sigue exponiendo las funciones de recuperación existentes y ahora es también la fachada pública de viajes.

## Scripts

- `npm.cmd run db:limpiar -- --prueba|--demo`: borra por prefijo aislado y muestra cuántas filas eliminó.
- `npm.cmd run probar:flujo`: ejecuta los 14 casos contra Postgres a través de `dataService`; limpia antes y al finalizar, y cierra el pool.
- `npm.cmd run db:demo`: reemplaza la muestra en `dev-demo-0001` y lista cinco viajes. El runner TypeScript usa `scripts/tsconfig.scripts.json` para resolver alias del proyecto y mantener los módulos de aplicación protegidos como server-only.

## Verificación

- `npm.cmd run probar:flujo`: 14 `OK`, 0 fallas. Incluye validación, creación, actualización, alternancia, filtro por estado, orden por fecha de inicio, resumen, not-found y aislamiento entre dispositivos. Los dispositivos `dev-test-*` quedan limpios.
- `npm.cmd run db:demo`: 5 filas impresas; Cartagena, Eje Cafetero y Bogotá planeados; Medellín y San Andrés completados.
- `npm.cmd run db:limpiar -- --prueba`: 0 filas de prueba residuales.
- `npm.cmd run db:verificar`: 0 fallas en esquema, restricciones, RLS, permisos y casos de integridad; el verificador concluyó con `ROLLBACK`.
- `npm.cmd test`: 9 archivos, 29 pruebas correctas.
- `npm.cmd run type-check`: correcto.
- `npm.cmd run build`: correcto.
- ESLint enfocado y `git diff --check`: correctos.

Las operaciones PostgreSQL se ejecutaron con `PGSSLROOTCERT` configurado fuera del repositorio y verificación TLS activa (`rejectUnauthorized: true`). Los cinco ejemplos quedan aislados bajo `device_id = dev-demo-0001`; se pueden retirar con `npm.cmd run db:limpiar -- --demo`.

## P05 · API protegida

- Rutas implementadas: GET/POST `/api/viajes`; GET/PATCH/DELETE `/api/viajes/[id]`; PATCH `/api/viajes/[id]/completar`; GET `/api/viajes/resumen`.
- Cada handler exige sesión antes de procesar la solicitud, usa `conManejoDeErrores`, valida UUID, query y cuerpo, marca `dynamic = "force-dynamic"` y responde con `Cache-Control: no-store`.
- Pruebas de rutas: 13 casos pasaron, incluyendo 201 al crear, 401 sin sesión, datos/UUID inválidos, params asíncronos, 404, 422 y contratos de respuesta.
- Sin sesión, GET y POST `/api/viajes` respondieron HTTP 401.
- Con sesión, el recorrido API local de create/list/get/edit/complete/summary/delete pasó con estados `201, 200, 200, 200, 200, 200, 200`; fechas invertidas respondió HTTP 422 `FECHA_FIN_ANTERIOR`. El viaje temporal se eliminó y la lista final confirmó que no quedó.
- `npm.cmd test`: 13 archivos, 42 pruebas correctas (incluye las 13 pruebas nuevas de API).
- `npm.cmd run type-check`, `npm.cmd run build`, ESLint enfocado y `git diff --check`: correctos.
