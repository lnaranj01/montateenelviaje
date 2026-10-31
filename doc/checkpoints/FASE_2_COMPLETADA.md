# Fase 2 · Reglas de negocio completadas

Fecha de cierre: 2026-10-31.

## Reglas implementadas

- `validarViaje` valida destino, fechas reales, orden de fechas y presupuesto entero no negativo en el orden establecido.
- `esFechaValida` valida estrictamente `YYYY-MM-DD` y fechas del calendario.
- `finNoAnteriorAInicio` permite viajes de un día.
- `duracionDias` cuenta los dos extremos del viaje usando `Date.UTC`, sin leer el reloj local.
- `alternarEstado` y `etiquetaEstado` representan el estado Planeado/Completado.
- `ErrorDeNegocio` usa mensajes y estados HTTP de la tabla 9.2.

## Pruebas

Las 18 pruebas solicitadas T-01 a T-18 se ejecutaron con entorno Node. La configuración mantiene las pruebas existentes en un proyecto separado con jsdom.

Salida resumida de `npm.cmd test -- --reporter=dot`:

```text
Test Files  9 passed (9)
Tests       28 passed (28)
```

Los 28 casos incluyen T-01 a T-18 y las 10 pruebas existentes de la aplicación.

## Build

`npm.cmd run build`: correcto; compilación, TypeScript, generación de páginas y optimización completadas sin errores.

## Nota de compatibilidad

Vitest ya estaba instalado como dependencia de desarrollo. Se añadió el script `test:ver` solicitado sin volver a instalar la dependencia. El build inicial detectó índices potencialmente indefinidos al descomponer fechas; se corrigieron los guardas de tipos y la segunda validación pasó.

La suite se configuró para que los tests de reglas no se ejecuten también en el proyecto de la aplicación; cada caso nuevo se cuenta una sola vez.
