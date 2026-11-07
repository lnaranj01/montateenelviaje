# Plan de comercio y reservas de viaje

Estado: diseño inicial; todavía no hay búsqueda, ofertas ni compras en la aplicación.

## Objetivo del producto

Ampliar el organizador para que una persona pueda planear un viaje y comprar o reservar desde el mismo recorrido: hospedaje, vuelos, transporte, actividades y, posteriormente, artículos esenciales. El primer mercado es Colombia y el precio objetivo se presenta y cobra en pesos colombianos (COP), incluso a compradores con tarjetas emitidas en otros países.

Este plan extiende el organizador existente sin reemplazar sus viajes, filtros, resumen ni autenticación.

## Decisiones iniciales

- **Empezar por hospedaje.** Es una necesidad frecuente y hay un flujo de reserva dentro de la aplicación documentado para el inventario de alojamientos de Booking.com Demand API.
- **Mantener proveedor y cumplimiento de la reserva.** El proveedor aporta inventario, confirma disponibilidad y procesa la reserva según el flujo y contrato habilitados. La plataforma guarda una referencia de reserva y ayuda a encontrarla; no se convierte al inicio en agencia, aerolínea, hotel ni vendedor de los servicios.
- **Experiencia integrada, no promesa de una sola compra.** La búsqueda, comparación, revisión final y confirmación se presentan dentro de la aplicación cuando el proveedor lo permite. Cada proveedor puede requerir una confirmación o transacción independiente; no habrá carrito universal en la primera versión.
- **Precios y monto a cobrar en COP.** La intención es enviar al proveedor un monto final en COP y aceptar tarjetas internacionales compatibles. La red de la tarjeta y el banco emisor convierten ese cargo a la moneda de la cuenta del comprador y pueden aplicar una tasa, demora o comisión. No se debe prometer aceptación de cualquier tarjeta ni una tasa exacta del banco.
- **No fingir conversión ni disponibilidad.** Antes de mostrar una tarifa, verificar la moneda de la cotización, el monto final, la vigencia, la tarifa de cambio y los métodos de pago disponibles en el contrato real. Si no se puede cobrar en COP, detener el lanzamiento de ese flujo o informar claramente la moneda que se cobrará y obtener aprobación expresa; no mostrar un equivalente estimado como si fuera el total final.
- **No almacenar datos de tarjetas.** El cobro usa el método seguro del proveedor autorizado; los secretos y tokens son únicamente del servidor. Los pedidos se asocian a la cuenta autenticada, no solo al `device_id`.
- **Sin socios ni cuentas de comercio actualmente.** No hay credenciales de afiliado, APIs de inventario, cuentas de vendedor ni configuración de pagos confirmadas. La siguiente tarea es obtener acceso sandbox/contrato; hasta entonces no se pueden probar precios ni compras reales.

## Proveedor de arranque y límites comprobados

La primera integración a evaluar es Booking.com Demand API para alojamientos con el flujo **Search, look and book**. Su documentación describe búsqueda, disponibilidad en vivo, previsualización del total y las condiciones, y creación de la reserva desde la plataforma sin redirigir al viajero. El acceso requiere ser Managed Affiliate Partner, acuerdo con Booking.com, Partner Centre, API key y Affiliate ID.

Ese acceso no se presume concedido. Primero se debe tramitar con el titular del proyecto, revisar los términos y comprobar en sandbox que el mercado, destino, moneda COP, cargos, pago, cancelación y soporte cumplen las decisiones anteriores. La API ofrece un flujo distinto de búsqueda y redirección; usarlo no equivale a reservar dentro de la app.

Booking.com Demand API documenta también hospedaje, alquiler de autos, atracciones y transferencias, pero cada categoría y flujo tiene capacidades y disponibilidad propias. Las atracciones documentadas usan búsqueda y redirección; los transfers están en beta. No se habilitarán en la primera versión ni se presentarán como compras dentro de la aplicación.

Vuelos requieren un proveedor y un ciclo de emisión, cambios, cancelación y reembolso independiente. Los artículos esenciales son comercio minorista distinto de inventario de viajes. Ambos quedan para fases posteriores, tras evaluar sus contratos y responsabilidades.

## Fases propuestas

### COM-01 · Acceso de socios y validación comercial

1. Solicitar acceso de afiliado administrado y sandbox del proveedor seleccionado.
2. Obtener por canal privado los términos, mercados, monedas, esquema de pagos, comisiones, responsabilidades de soporte, privacidad y políticas de cancelación/reembolso.
3. Confirmar con datos sandbox: búsqueda de Colombia, precio final en COP, aceptación de tarjetas internacionales, validez de la cotización y quién cobra y confirma la reserva.
4. No guardar secretos en Git, mensajes, navegador ni logs; configurar credenciales de sandbox y producción como variables secretas independientes.

**Salida:** una matriz escrita de capacidades confirmadas y criterios de lanzamiento. Si la moneda COP o la tarjeta internacional no están soportadas para el flujo ofrecido, documentar la alternativa y no fingir que el requisito está resuelto.

### COM-02 · Hospedaje (primer MVP)

- Agregar a cada viaje un punto de entrada “Buscar hospedaje”, tomando destino y fechas existentes.
- Solicitar cantidad de viajeros/habitaciones y los datos estrictamente requeridos por el proveedor; validar fechas y ocupación.
- Implementar búsqueda, filtros esenciales, detalles y disponibilidad/precio en vivo con estados de carga, error y sin resultados.
- Antes de reservar, volver a consultar disponibilidad y mostrar el total, moneda efectivamente cobrada, impuestos/cargos, política de cancelación, condiciones y vencimiento de la oferta.
- Tras consentimiento explícito, crear la orden mediante el flujo autorizado y mostrar confirmación o estado pendiente sin asumir éxito por una respuesta de redirección.
- Guardar únicamente la referencia del proveedor, viaje, estado y datos mínimos para mostrar/consultar la reserva; obtener de nuevo el estado real al consultar al proveedor.
- Ofrecer acceso claro a la reserva y a las políticas/soporte del proveedor. No inventar botones de cancelar o reembolsar cuando el contrato no dé esa capacidad.

### COM-03 · Transporte y actividades

- Evaluar alquiler de autos/transfers con un socio y flujo realmente aprobados.
- Evaluar actividades con un proveedor que permita completar reserva dentro de la plataforma; el flujo de redirección se debe etiquetar como compra que se termina en el sitio del socio.
- Compartir fechas, destino y viajeros solo después de informar qué datos se envían a cada socio.

### COM-04 · Vuelos

- Evaluar por separado un agregador de vuelos, su programa de agencia/emisión, acceso a tarifas, ticketing, equipaje, cambios, cancelaciones y soporte.
- No crear una reserva aérea como si fuera una compra confirmada hasta recibir confirmación de emisión del proveedor.
- Hacer que la tarifa vuelva a validarse justo antes del pago y mostrar sus condiciones y moneda final.

### COM-05 · Artículos esenciales y pagos internacionales

- Evaluar si artículos (equipaje, adaptadores y otros) se venderán mediante tienda afiliada o inventario propio. Definir despacho, impuestos, devoluciones, garantía y quién es vendedor antes de mostrarlos como comprables.
- Solo si se requiere carrito común entre socios, comparar un procesador de pagos para Colombia, operaciones en COP, tarjetas extranjeras, conversión, contracargos, conciliación y liquidación. No agregar Mercado Pago u otro procesador al azar: primero revisar elegibilidad comercial, comisiones, monedas soportadas y el flujo de pago exigido por cada socio.
- Si se cobra en COP, el cargo del comprador es COP; la conversión a la moneda de su cuenta la determina su emisor/red de tarjeta. “Cualquier moneda” no se puede garantizar: aceptación, tipo de cambio y comisiones dependen del emisor y del proveedor.

## Arquitectura y seguridad

- Conservar Next.js App Router, Zod, `dataService` y PostgreSQL; las llamadas a proveedores salen únicamente de módulos de servidor y rutas autenticadas de `app/api/compras/`.
- Definir adaptadores internos por proveedor para búsqueda, cotización final, creación de orden y consulta de estado. No mezclar reglas del proveedor con componentes visuales ni acoplar la interfaz a su respuesta cruda.
- Validar todas las respuestas externas antes de utilizarlas; tratar precios, disponibilidad, identificadores y URLs del proveedor como datos no confiables.
- Asociar una orden al usuario de Supabase que inició la operación y validar esa propiedad en cada consulta. `device_id` por sí solo no autoriza a ver compras o datos personales.
- Agregar tablas de reservas y eventos mediante migraciones aditivas. Guardar identificadores externos, estado, moneda, montos y datos mínimos necesarios; no copiar la tabla `viajes` para modelar órdenes.
- Usar idempotencia para evitar reservas/cargos duplicados cuando el navegador reintente. Confirmar estados mediante callbacks/webhooks firmados si el proveedor los ofrece y cotejarlos con consulta servidor-a-servidor.
- Nunca confiar en un retorno del navegador para confirmar el pago; nunca exponer tokens, datos de tarjeta o credenciales de API. Redactar datos personales y secretos en logs.
- Separar sandbox y producción; no hacer compras reales como prueba. Probar resultados, errores, timeout, duplicados, tarifa vencida, precio cambiado, rechazo y cancelación conforme al contrato.

## Requisitos para salir a producción

1. Contrato, cuenta de socio y permisos de producción aprobados.
2. Precio y moneda final verificados antes del consentimiento; para el MVP, cobrar en COP o bloquear la compra según la decisión comercial.
3. Responsable de venta/cobro, confirmación, servicio al cliente, cancelaciones, reembolsos, disputas e impuestos identificado públicamente.
4. Datos del comprador minimizados, tratamiento de privacidad y protección de cuenta/pedido revisados.
5. Flujo completo aprobado en sandbox; webhooks/consultas e idempotencia verificados.
6. Registro auditable de referencia y estado de la reserva, con mensajes claros para pendiente, confirmada, rechazada o no verificable.
7. Pruebas móviles y de accesibilidad, monitoreo sin PII y procedimiento para desactivar una integración si el socio falla.

## Fuentes oficiales consultadas

- [Booking.com Demand API: capacidades y servicios](https://developers.booking.com/demand/docs/getting-started/overview)
- [Booking.com: prerequisitos del socio administrado](https://developers.booking.com/demand/docs/getting-started/prerequisites)
- [Booking.com: Search, look and book](https://developers.booking.com/demand/docs/development-guide/application-flows/search-look-book)
- [Booking.com: Search, look and redirect](https://developers.booking.com/demand/docs/development-guide/application-flows/search-look-redirect)
- [Mercado Pago Colombia: Checkout API](https://www.mercadopago.com.co/developers/en/docs/checkout-api-payments/overview)

La disponibilidad comercial, monedas, comisiones, pago, países y condiciones finales deben verificarse con el proveedor y el procesador antes de escribir la integración.
