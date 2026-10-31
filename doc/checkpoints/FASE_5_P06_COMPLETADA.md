# P06 · Interfaz base y lista de viajes

Fecha de cierre: 2026-10-31.

## Entrega

- `/viajes` quedó protegida por un layout de servidor que usa `obtenerSesion()` y redirige al login cuando no hay sesión.
- El encabezado muestra el título del organizador, el correo autenticado y el cierre de sesión.
- La página cliente obtiene viajes con el `deviceId`, presenta contador, tarjetas con fechas/duración/presupuesto/estado, carga, error con reintento y el estado vacío definido en el plan.
- Los botones de las tarjetas están intencionalmente deshabilitados hasta implementar sus acciones en P07.
- El landing existente se conserva y ahora enlaza al organizador.
- Se agregaron los tokens de color de la identidad visual y componentes UI con estados de foco y el modal con Escape y control de foco.

## Verificación

- `npm.cmd test`: 45 pruebas correctas en 14 archivos, incluidas tres pruebas nuevas de la lista.
- `npm.cmd run type-check`, `npm.cmd run build`, ESLint enfocado y `git diff --check`: correctos.
- En navegador con sesión iniciada: `/viajes` mostró el encabezado, el contador en cero y el mensaje de lista vacía.
- A 390 px, `document.documentElement.scrollWidth` fue 375 px y no hubo desbordamiento horizontal.
