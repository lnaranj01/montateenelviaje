# Fase 7 · Filtros, orden y resumen

Fecha de cierre: 2026-11-07.

## Funcionalidad

- `FiltrosViajes` permite ver todos los viajes o filtrar por Planeado/Completado, y ordenar por fecha de creación o fecha de inicio. Las selecciones se reflejan en la URL y se leen desde `searchParams` en la página servidor.
- `ListaViajes` solicita el filtro y orden al endpoint existente, conserva el contador total del dispositivo e informa el número de resultados visibles.
- `ResumenViajes` consulta el endpoint protegido y muestra el total de viajes, planeados, completados y presupuesto total formateado. El resumen siempre incluye todos los viajes del dispositivo, de acuerdo con F7, e indica cuántos corresponden al filtro actual.

## Aceptación y pruebas

- A-15 aprobada en producción con tres viajes temporales: el filtro Completado mostró solo ese estado y el resumen indicó un viaje en el filtro; el orden por fecha de inicio fue 05/12, 10/12 y 20/12.
- El resumen reflejó 3 viajes, 2 planeados, 1 completado y $600.000; se comprobó la suma de presupuestos de $100.000, $200.000 y $300.000.
- Los tres registros temporales se eliminaron y la lista volvió a 0.
- `npm.cmd test`: 60 pruebas correctas en 18 archivos.
- `npm.cmd run type-check`, `npm.cmd run build`, ESLint enfocado, Prettier enfocado y `git diff --check`: correctos.
