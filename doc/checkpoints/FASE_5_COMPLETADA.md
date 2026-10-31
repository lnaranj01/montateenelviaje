# Fase 5 · Interfaz de viajes completada

Fecha de cierre: 2026-10-31.

## Entrega

- La ruta `/viajes` está protegida y muestra el encabezado autenticado.
- El formulario de la página principal permite crear y editar viajes con validación en español y presupuesto entero.
- La lista presenta contador, fechas, duración, presupuesto y estado; las acciones de completar/reactivar actualizan la lista.
- El borrado solo se ejecuta tras confirmar en el modal; cancelar conserva el registro.
- README y plan funcional enlazado desde la documentación.

## Verificación

- `npm.cmd test`: 55 pruebas correctas en 16 archivos.
- `npm.cmd run type-check`, `npm.cmd run build` y ESLint enfocado: correctos.
- En el navegador local: crear, editar, completar, reactivar, cancelar el borrado y confirmar el borrado; el contador final quedó en cero.
- Las pruebas y operaciones de base de datos se aislaron por `device_id`; no quedaron registros temporales de aceptación.

La ejecución A-01 a A-14 en el despliegue de Vercel está pendiente y se registra en `doc/ACEPTACION.md`.
