# Fase 1 · Base de datos completada

Fecha de cierre: 2026-10-31.

## Migración

- Se verificó que la migración de perfiles `20261003000000_create_profiles.sql` ya estaba aplicada (columnas, RLS, políticas y trigger); se registró en `public._migrations` sin reejecutarla.
- Se aplicó `20261031000000_viajes_tabla.sql` mediante `npm.cmd run db:migrar`.
- La tabla `public.viajes` quedó protegida con RLS, sin políticas, y con permisos revocados a `anon` y `authenticated`.
- El cliente verificó el certificado raíz de Supabase mediante `PGSSLROOTCERT`; nunca se desactivó la validación TLS.

## Salida de `npm.cmd run db:verificar`

```text
> app@0.1.0 db:verificar
> node scripts/verificar-bd.mjs

Conexión: POSTGRES_URL_NON_POOLING
Tabla public.viajes: existe
OK existencia de tabla viajes
Filas: 0
OK restricción viajes_destino_minimo: presente
OK restricción viajes_presupuesto_ok: presente
OK restricción viajes_fechas_ok: presente
RLS activo: sí
OK RLS activo
OK sin políticas públicas
OK acceso de lectura revocado para anon y authenticated
OK insert válido
OK rechazo de presupuesto negativo: viajes_presupuesto_ok
OK rechazo de fechas invertidas: viajes_fechas_ok
OK rechazo de destino de un carácter: viajes_destino_minimo
OK viaje de un día
Transacción de pruebas: ROLLBACK completado.
Total de fallas: 0
```

## Build

`npm.cmd run build`: correcto; Next.js compiló, completó TypeScript, generó las páginas y finalizó la optimización sin errores.

La segunda ejecución de `npm.cmd run db:migrar` omitió ambas migraciones por estar registradas. Una segunda ejecución de `npm.cmd run db:verificar` volvió a terminar con 0 fallas y 0 filas, confirmando idempotencia y rollback de los datos de prueba.
