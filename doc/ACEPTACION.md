# Aceptación del organizador de viajes

Ejecutar A-01 a A-14 en el despliegue de Vercel y registrar el resultado y la evidencia. A-15 pertenece a la funcionalidad opcional de P08.

Ejecución en [producción](https://montateenelviaje.vercel.app). Los registros creados para la prueba se eliminaron al finalizar.

| ID   | Acción                                                                  | Resultado esperado                                 | Resultado obtenido | Evidencia | Observación |
| ---- | ----------------------------------------------------------------------- | -------------------------------------------------- | ------------------ | --------- | ----------- |
| A-01 | Abrir `/viajes` sin sesión                                              | Redirección al login                               | Aprobada           | `/viajes` anónimo: 307 a `/login`; API anónima: 401; health: 200 | |
| A-02 | Con la lista vacía, ver la pantalla                                     | Mensaje de lista vacía y contador en 0             | Aprobada           | “Tu próxima aventura empieza aquí”; contador 0 | Lista vacía antes de iniciar |
| A-03 | Registrar "Cartagena" del 10/12 al 15/12, con presupuesto de $1.500.000 | Aparece en la lista; contador 1; estado Planeado   | Aprobada           | Cartagena, 10–15/12/2026, $1.500.000; contador 1 y estado Planeado | |
| A-04 | Intentar un viaje con fecha de fin anterior a la fecha de inicio        | Rechazo con mensaje claro junto a la fecha de fin  | Aprobada           | Error junto a fecha de fin: “La fecha de fin no puede ser anterior a la de inicio.”; contador sin cambios | |
| A-05 | Intentar un presupuesto negativo                                        | Rechazo con mensaje de validación                  | Aprobada           | Presupuesto -1 rechazado con “Ingresa un presupuesto entero igual o mayor a 0.” | |
| A-06 | Intentar guardar con un campo vacío                                     | Rechazo y mensaje en el campo obligatorio          | Aprobada           | Fechas y presupuesto vacíos; mensajes obligatorios y ningún viaje creado | |
| A-07 | Registrar un segundo viaje, "Medellín"                                  | Contador 2                                         | Aprobada           | Medellín agregado; contador 2 | |
| A-08 | Marcar "Cartagena" como Completado                                      | La tarjeta se atenúa y el estado indica Completado | Aprobada           | Estado Completado y clase visual `opacity-75` verificados | |
| A-09 | Reactivar "Cartagena"                                                   | Vuelve al estado Planeado                          | Aprobada           | Estado Planeado y acción disponible “Completar” | |
| A-10 | Editar "Medellín" cambiando el presupuesto                              | Se guarda y muestra el nuevo presupuesto           | Aprobada           | Presupuesto actualizado de $900.000 a $1.200.000 | |
| A-11 | Elegir eliminar "Medellín"                                              | Aparece la confirmación antes de borrar            | Aprobada           | Diálogo de confirmación visible; contador seguía en 2 | |
| A-12 | Confirmar la eliminación                                                | El viaje desaparece y el contador queda en 1       | Aprobada           | Medellín desapareció; contador 1 | |
| A-13 | Cancelar una eliminación                                                | El viaje permanece en la lista                     | Aprobada           | Diálogo cerrado; Cartagena permaneció; contador 1 | |
| A-14 | Cerrar el navegador y volver a entrar                                   | Los viajes persisten en la base de datos           | Aprobada           | Registro de prueba persistió al abrir `/viajes` en una pestaña nueva; tras limpiar, contador 0 | |
| A-15 | (Opcional) Filtrar por Completados y ver el resumen                     | La lista y el resumen responden a los filtros      |                    |           |             |

A-15 se ejecuta únicamente después de implementar P08.
