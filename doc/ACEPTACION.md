# Aceptación del organizador de viajes

Ejecutar A-01 a A-14 en el despliegue de Vercel y registrar el resultado y la evidencia. A-15 pertenece a la funcionalidad opcional de P08.

| ID   | Acción                                                                  | Resultado esperado                                 | Resultado obtenido | Evidencia | Observación |
| ---- | ----------------------------------------------------------------------- | -------------------------------------------------- | ------------------ | --------- | ----------- |
| A-01 | Abrir `/viajes` sin sesión                                              | Redirección al login                               |                    |           |             |
| A-02 | Con la lista vacía, ver la pantalla                                     | Mensaje de lista vacía y contador en 0             |                    |           |             |
| A-03 | Registrar "Cartagena" del 10/12 al 15/12, con presupuesto de $1.500.000 | Aparece en la lista; contador 1; estado Planeado   |                    |           |             |
| A-04 | Intentar un viaje con fecha de fin anterior a la fecha de inicio        | Rechazo con mensaje claro junto a la fecha de fin  |                    |           |             |
| A-05 | Intentar un presupuesto negativo                                        | Rechazo con mensaje de validación                  |                    |           |             |
| A-06 | Intentar guardar con un campo vacío                                     | Rechazo y mensaje en el campo obligatorio          |                    |           |             |
| A-07 | Registrar un segundo viaje, "Medellín"                                  | Contador 2                                         |                    |           |             |
| A-08 | Marcar "Cartagena" como Completado                                      | La tarjeta se atenúa y el estado indica Completado |                    |           |             |
| A-09 | Reactivar "Cartagena"                                                   | Vuelve al estado Planeado                          |                    |           |             |
| A-10 | Editar "Medellín" cambiando el presupuesto                              | Se guarda y muestra el nuevo presupuesto           |                    |           |             |
| A-11 | Elegir eliminar "Medellín"                                              | Aparece la confirmación antes de borrar            |                    |           |             |
| A-12 | Confirmar la eliminación                                                | El viaje desaparece y el contador queda en 1       |                    |           |             |
| A-13 | Cancelar una eliminación                                                | El viaje permanece en la lista                     |                    |           |             |
| A-14 | Cerrar el navegador y volver a entrar                                   | Los viajes persisten en la base de datos           |                    |           |             |
| A-15 | (Opcional) Filtrar por Completados y ver el resumen                     | La lista y el resumen responden a los filtros      |                    |           |             |

A-15 se ejecuta únicamente después de implementar P08.
