# Organizador de Viajes · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_VIAJES.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: proyecto desplegado en Vercel, Supabase conectado y login funcionando

---

## Nota para Luis Daniel

Tu plan original estaba hecho en HTML + CSS + JavaScript con LocalStorage, que es un punto de partida muy válido para un primer proyecto. Estos prompts lo convierten al stack del curso (Next.js + Supabase + Vercel), conservando toda tu lógica: los mismos campos, los mismos estados, el mismo flujo. Lo que cambia es que los viajes se guardan en una base de datos real en lugar del navegador, y la app queda protegida por el login. Vas a ver aparecer conceptos nuevos (base de datos, API, pruebas); los prompts los explican paso a paso y el plan técnico es la referencia completa.

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_VIAJES.md` y `PROMPTS_VIAJES.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt: revisar los cambios y aceptarlos (**Keep**); hacer la verificación indicada; hacer commit con el mensaje sugerido y `git push`. Vercel desplegará; si falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final.

| Fase | Prompts |
|---|---|
| 0 · Preparación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz | P06, P07 |
| 7 · Opcional | P08 |

---

## P00 · Auditoría del repositorio y archivos de control

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio Next.js.

Contexto: el proyecto "Organizador de Viajes" (registrar, editar, eliminar y completar viajes personales) ya está desplegado en Vercel, conectado a Supabase y tiene login funcionando. El plan técnico está en doc/PLAN_VIAJES.md. Este prompt NO implementa funcionalidades: audita el repositorio y crea los archivos de control.

Lee completo doc/PLAN_VIAJES.md, en especial las secciones 0, 1, 2 y 15.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con estas secciones, llenas con lo que encuentres. No supongas: si algo no existe, escribe "No existe".
1. Versiones (package.json): next, react, typescript, tailwindcss, pg, zod, @supabase/supabase-js, vitest.
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/ y scripts/ hasta 3 niveles. Indica si usa carpeta src/.
4. Alias de importación en tsconfig.json.
5. Autenticación: archivos; mecanismo; función que lee la sesión y qué devuelve; ruta de la página de login; ruta a la que redirige después del login (archivo y línea); archivo de middleware o proxy y su matcher; cómo se cierra sesión.
6. Acceso a datos: clientes de Supabase existentes, uso del paquete pg, archivo de pool si existe.
7. Migraciones: carpeta, archivos existentes y su numeración, tabla de control, script o página que las aplica.
8. Variables de entorno: solo los NOMBRES presentes en .env.local y .env.example (NUNCA copies valores). Indica si existe una cadena de conexión directa a Postgres (DATABASE_URL o similar) y con qué nombre.
9. Estilos: versión de Tailwind, ubicación de globals.css, fuentes, tokens de color existentes, librería de íconos.
10. Pruebas: framework existente.
11. Conflictos con el plan: existencia previa de app/viajes, app/api/viajes, lib/dataService.ts y components/ui; contenido de app/page.tsx; tabla existente llamada viajes y, si existe, sus columnas.
12. Decisiones derivadas:
    - Ruta de la página de login.
    - Archivo de protección de rutas (proxy.ts en Next.js 16, middleware.ts antes) y si ya existe.
    - Mecanismo de migraciones a usar.
    - Nombre de la variable de conexión a Postgres que usará conexion.ts.
    - Nombre exacto que tendrá M1 continuando la numeración existente.
    - Prefijo de imports para lib.
13. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea .github/copilot-instructions.md reemplazando [AJUSTAR] con lo hallado:

```markdown
# Organizador de Viajes · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_VIAJES.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable [AJUSTAR: variable de conexión].
- Validación con Zod. Pruebas con Vitest.
- Login existente: [AJUSTAR]. No se reescribe. Puerta única, sin roles. Los viajes se agrupan por device_id.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español (el plan pide código comentado en español).
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto fechas.ts). Se prueban con Vitest.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/viajes/ llama await exigirSesion() como primera instrucción, y toda operación filtra por device_id.
- Entradas validadas con los esquemas de lib/validacion/esquemas.ts.
- Errores de negocio con ErrorDeNegocio(codigo); respuestas con lib/http/respuestas.ts.
- El presupuesto es un entero en pesos. Nunca decimales ni string.
- Fechas 'YYYY-MM-DD' como texto entre capas. La fecha de fin no puede ser anterior a la de inicio.
- En rutas dinámicas params es una Promise: const { id } = await params.
- SQL siempre con parámetros ($1, $2). Nunca concatenar valores.
- Eliminar un viaje exige confirmación en la interfaz. Un viaje nuevo nace "Planeado".
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: [AJUSTAR].
- Archivo de protección de rutas: [AJUSTAR]. Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa y hace el commit.
```

TAREA 3. Crea doc/ESTADO_EJECUCION.md:

```markdown
# Estado de ejecución · Organizador de Viajes

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | pendiente | | | |
| P01 Base de datos | pendiente | | | |
| P02 Reglas de negocio | pendiente | | | |
| P03 Servidor | pendiente | | | |
| P04 Datos | pendiente | | | |
| P05 API | pendiente | | | |
| P06 Interfaz base y lista | pendiente | | | |
| P07 Formulario, editar, eliminar, completar y aceptación | pendiente | | | |
| P08 Opcional: filtros y resumen | pendiente | | | |

## Bitácora

Cada prompt agrega una sección con: archivos creados, archivos modificados, comandos ejecutados y su resultado, problemas y cómo se resolvieron, pendientes.
```

TAREA 4. Si no existe node_modules, ejecuta npm install. Luego npm run build y registra el resultado en la sección 13 de ESTADO_ACTUAL.md. Si falla, NO corrijas: describe el error.

TAREA 5. Si la variable de conexión directa a Postgres no existe en .env.local, explícame en lenguaje sencillo cómo obtenerla en Supabase (botón Connect, opción Transaction pooler, puerto 6543, reemplazar la contraseña) y agregarla a .env.local y a Vercel. No continuar con P01 sin ella.

RESTRICCIONES: no modifiques código, configuración ni dependencias. Solo crea los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: resultado de la compilación, existencia de la variable de conexión, mecanismo de login, decisiones derivadas.
- Marca P00 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y los riesgos para los siguientes prompts.
````

**Verificación del estudiante:** abrir `doc/ESTADO_ACTUAL.md` y confirmar que la sección 5 describe el login real y que la 8 identifica la variable de conexión a Postgres. Conseguirla si falta antes de P01.

**Commit sugerido:** `docs: auditoría del repositorio y archivos de control para Copilot`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea:** una migración, `scripts/verificar-bd.mjs` y, si hace falta, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 5, 7 y 13), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: crear y aplicar la migración de la tabla de viajes y dejar un script que demuestre que la base protege las reglas (presupuesto ≥ 0, fecha fin ≥ inicio, destino no vacío).

TAREA 1. Si ESTADO_ACTUAL.md reporta una tabla previa llamada viajes que NO corresponda a este plan, detente y avísame. Si no, crea en supabase/migrations/ un archivo con el nombre de la sección 12 de ESTADO_ACTUAL.md:
- M1 (tabla y seguridad) con el SQL exacto de la sección 7.2 del plan.
No cambies nombres de tabla, columnas ni restricciones: el código depende de ellos (sección 7.3).

TAREA 2. Aplica la migración con el mecanismo existente o creando scripts/migrar.mjs (lee la variable de conexión; ssl { rejectUnauthorized: false }; tabla _migrations; aplica en orden alfabético los archivos no registrados en una transacción; imprime "aplicada"/"omitida"; código 1 si falla) y el script "db:migrar". Si hay migraciones anteriores ya aplicadas por otro medio, regístralas sin ejecutarlas y explícalo.

TAREA 3. Crea scripts/verificar-bd.mjs y "db:verificar". Debe imprimir:
1. Existencia de la tabla viajes.
2. Número de filas.
3. Restricciones (pg_constraint): viajes_destino_minimo, viajes_presupuesto_ok, viajes_fechas_ok.
4. Si RLS está activo en la tabla.
5. Pruebas de integridad en UNA transacción que SIEMPRE termina en ROLLBACK, con SAVEPOINT antes de cada caso que debe fallar:
   a) Insertar viaje válido (device 'dev-test', destino "Cartagena", 2026-12-10 a 2026-12-15, presupuesto 1500000, completado false): funciona.
   b) Insertar viaje con presupuesto -1: 23514 (viajes_presupuesto_ok).
   c) Insertar viaje con fecha_fin 2026-12-05 y fecha_inicio 2026-12-10 (fin antes del inicio): 23514 (viajes_fechas_ok).
   d) Insertar viaje con destino "A" (1 carácter): 23514 (viajes_destino_minimo).
   e) Insertar viaje con fecha_fin = fecha_inicio (mismo día): funciona (viaje de un día).
   Imprime "OK" o "FALLA" por caso.
6. Total de fallas; termina con código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques archivos del login ni de app/. No crees tablas distintas a la del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida de npm run db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase, Table Editor, debe aparecer la tabla `viajes`. La salida de `npm run db:verificar` no debe tener FALLA, y el caso e debe confirmar que un viaje del mismo día se permite.

**Commit sugerido:** `feat(bd): tabla de viajes con sus restricciones`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/viajes.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 5, 8.3, 8.4, 8.5, 9.2, 12 y 14.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas puras y probarlas con Vitest. Son la lógica verificable del proyecto: validación del viaje y comparación de fechas.

TAREA 1. Instala vitest (desarrollo). Agrega "test": "vitest run" y "test:ver": "vitest". Crea vitest.config.ts con environment 'node', include ['tests/**/*.test.ts'] y el alias '@' de tsconfig.json.

TAREA 2. Crea lib/config/viajes.ts con el contenido exacto de la sección 8.4.

TAREA 3. Crea lib/reglas/ con las firmas exactas de la sección 8.5:
- errores.ts: CodigoError; MENSAJES y ESTADO_HTTP con la tabla 9.2; clase ErrorDeNegocio (name 'ErrorDeNegocio'; si no recibe mensaje usa MENSAJES[codigo]).
- fechas.ts: esFechaValida (formato YYYY-MM-DD estricto y fecha real; rechaza "2026-13-10", "10/12/2026" y "2026-02-30"); finNoAnteriorAInicio(inicio, fin) (fin >= inicio comparando los textos YYYY-MM-DD, que se ordenan igual que las fechas); duracionDias(inicio, fin) (días inclusive con Date.UTC: del 10 al 15 son 6, del 10 al 10 es 1).
- viaje.ts: EstadoViaje; validarViaje({ destino, fechaInicio, fechaFin, presupuesto }) en este orden: destino recortado con al menos DESTINO_MIN caracteres (si no, DATOS_INVALIDOS); fechaInicio y fechaFin válidas (si no, DATOS_INVALIDOS); fin no anterior a inicio (si no, FECHA_FIN_ANTERIOR); presupuesto entero >= PRESUPUESTO_MINIMO (si no, DATOS_INVALIDOS). alternarEstado(completado) = !completado. etiquetaEstado(completado) = completado ? 'Completado' : 'Planeado'.

Ninguna regla importa pg, red, next ni process.env, ni llama new Date().

TAREA 4. Crea tests/reglas/ayudas.ts con esperarCodigo(fn, codigo).

TAREA 5. Crea las pruebas en tests/reglas/ (viaje, fechas) cubriendo T-01 a T-18 de la sección 14.1. Cada caso con su ID. Presta atención a T-05 (mismo día es válido), T-07 (duración inclusiva da 6), T-13 (presupuesto 0 es válido) y T-15 (fin anterior lanza FECHA_FIN_ANTERIOR, no DATOS_INVALIDOS).

TAREA 6. Ejecuta npm test hasta que pasen las 18. Si una falla, corrige la regla, no la prueba, salvo que contradiga el plan; explícalo.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida resumida de npm test.
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm test` (18 pruebas). Abrir `lib/reglas/viaje.ts` y ver cómo se valida que la fecha de fin no sea anterior a la de inicio.

**Commit sugerido:** `feat(reglas): validación de viaje y fechas con 18 pruebas`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión, device_id, respuestas, esquemas, formato y `/api/viajes/sesion` · **Modifica:** protección de rutas y redirección del login

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 1.3, 4, 7.3, 8.1, 8.3, 8.7, 9.1, 9.2, 9.4, 11 y 13), doc/ESTADO_ACTUAL.md (sección 5) y doc/ESTADO_EJECUCION.md.

OBJETIVO: dejar lista la infraestructura: conexión a Postgres, sesión, identidad de dispositivo, formato, esquemas.

TAREA 1. lib/db/conexion.ts como la sección 8.7. Usa el nombre real de la variable de conexión. Si ya hay pool, reutilízalo agregando los parsers.

TAREA 2. lib/auth/sesion.ts: obtenerSesion() (del login; devuelve { email } o null) y exigirSesion() (lanza NO_AUTORIZADO si no hay). Solo importa funciones del login; no modifica sus archivos.

TAREA 3. lib/deviceId.ts y lib/hooks/useDeviceId.ts (cliente): getOrCreateDeviceId() lee/escribe localStorage 'viajes_device_id' (UUID); useDeviceId() devuelve el deviceId (null durante SSR, string en el cliente).

TAREA 4. Protección de rutas en el archivo indicado: agrega /viajes/:path* y /api/viajes/:path* al matcher, conservando lo existente. Sin sesión: las páginas redirigen al login; las rutas /api/viajes responden 401 con el formato de la sección 9.1. Si no es posible en ese archivo, protege en el layout de /viajes (P06) y en exigirSesion(), y anótalo.

TAREA 5. Cambia SOLO el destino de la redirección posterior al login a /viajes.

TAREA 6. lib/http/respuestas.ts: responderOk; responderError (ErrorDeNegocio → ESTADO_HTTP; ZodError → 400 DATOS_INVALIDOS con flatten; pg 23514 → tabla 7.3 por error.constraint; otro → console.error y 500 ERROR_INTERNO); conManejoDeErrores; leerCuerpo. Todas con Cache-Control: no-store.

TAREA 7. lib/validacion/esquemas.ts con los esquemas de la sección 9.4, con tipos z.infer. No importa nada del servidor.

TAREA 8. lib/formato.ts: formatearPesos (Intl es-CO, COP, sin decimales); formatearFecha (Intl es-CO, dateStyle medium, timeZone UTC); formatearDuracion(dias) → "1 día" / "6 días".

TAREA 9. app/api/viajes/sesion/route.ts: GET con conManejoDeErrores; primera instrucción await exigirSesion(); responde { email }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Inicia npm run dev; sin sesión, GET /api/viajes/sesion da 401. Pídeme que inicie sesión y abra http://localhost:3000/api/viajes/sesion; espera mi confirmación de 200. Comprueba que el login redirige a /viajes (puede mostrar 404 hasta P06).

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados y el diff resumido de lo que tocaste del login o la protección.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `/api/viajes/sesion` da 401 sin sesión y 200 con sesión; el login lleva a `/viajes`.

**Commit sugerido:** `feat(servidor): conexión, sesión, device_id y utilidades`

---

## P04 · Datos: viajes

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/*`, `lib/dataService.ts`, `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts`, `scripts/cargar-demo.ts`

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 5, 6, 6.1, 7.3, 8.5, 8.6 y 14.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: implementar el acceso a datos y los casos de uso, y comprobar el flujo contra la base. Todas las operaciones filtran por device_id.

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 8.6 (Viaje, DatosViaje, ResumenViajes). Reutiliza EstadoViaje de lib/reglas/viaje.ts. El tipo Viaje incluye estado (etiquetaEstado) y duracionDias (duracionDias) calculados al leer.

TAREA 2. lib/datos/viajes.ts (cumple el papel de obtenerViajes/guardarViajes del plan, contra Postgres):
- listarViajes(deviceId, { estado, orden }): SELECT de los viajes del device; filtro por completado si estado viene; orden por created_at descendente (reciente) o por fecha_inicio (inicio); LIMITE_LISTADO; mapea cada fila a Viaje con estado y duracionDias.
- contarViajes(deviceId): COUNT de los viajes del device.
- obtenerViaje(deviceId, id): un viaje del device; si no existe, VIAJE_NO_ENCONTRADO.
- crearViaje(deviceId, d): validarViaje (sección 6.1); INSERT con completado false (RN-05); devuelve el Viaje creado.
- editarViaje(deviceId, id, d): validarViaje; UPDATE del viaje del device; si no afecta filas, VIAJE_NO_ENCONTRADO; devuelve el Viaje actualizado.
- eliminarViaje(deviceId, id): DELETE del viaje del device; si no afecta filas, VIAJE_NO_ENCONTRADO.
- alternarCompletado(deviceId, id): lee el viaje (VIAJE_NO_ENCONTRADO si no); UPDATE completado = NOT completado; devuelve el Viaje.
- obtenerResumen(deviceId): total, planeados (completado false), completados (completado true), presupuestoTotal (SUM de presupuesto) del device.
Todas las consultas incluyen WHERE device_id = $1 (RN-10).

TAREA 3. lib/dataService.ts como fachada: reexporta las funciones públicas y los tipos. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 4. scripts/limpiar-prueba.mjs con "db:limpiar": borra los viajes cuyo device_id empiece por 'dev-test' o 'dev-demo'. Imprime el conteo. Opciones --prueba y --demo.

TAREA 5. Instala tsx (desarrollo). Crea scripts/probar-flujo.ts con los 14 pasos de la sección 14.2 usando solo dataService, con un deviceId de prueba 'dev-test-0001' (y 'dev-test-0002' para el paso 14, el aislamiento entre dispositivos). Imprime OK/FALLA por paso; para los pasos que esperan error, verifica el código; limpia antes y en finally; cierra el pool; código 1 si hay fallas. "probar:flujo": "tsx --env-file=.env.local scripts/probar-flujo.ts" (o la variante con --import tsx). Ejecuta y corrige hasta 0 fallas.

TAREA 6. scripts/cargar-demo.ts con "db:demo": crea ~5 viajes de ejemplo para el device 'dev-demo-0001' (Cartagena, Medellín, Eje Cafetero, San Andrés, Bogotá), con fechas y presupuestos variados y uno o dos marcados como completados. Limpia los demo antes. Imprime una tabla con destino, fechas, presupuesto y estado. Ejecútalo. (Nota: como los viajes se agrupan por device_id, para verlos en la interfaz en P06 usarás el device_id de tu navegador; estos demo son sobre todo para la prueba de datos. Puedes indicarme cómo poner tu device_id real si quieres ver datos en pantalla.)

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega la salida de probar:flujo en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run probar:flujo` (14 OK, 0 fallas); el paso 14 confirma que un dispositivo no ve ni edita los viajes de otro.

**Commit sugerido:** `feat(datos): viajes con filtro por dispositivo y prueba de flujo`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `app/api/viajes/`

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 9.1 a 9.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesion.ts.

OBJETIVO: exponer las operaciones con rutas protegidas, todas filtrando por device_id.

TAREA 1. Crea las rutas de la tabla 9.3 (deja /api/viajes/resumen para P08 o créala ya; es inofensiva). Reglas de cada handler:
- Primera instrucción: await exigirSesion().
- conManejoDeErrores; cuerpos con leerCuerpo y los esquemas de 9.4; el deviceId llega en el cuerpo (POST/PATCH/DELETE) o en la query (GET) y se valida con esquemaDeviceId.
- [id] con await params (uuid).
- export const dynamic = 'force-dynamic'.
- POST de viajes responde 201. PATCH /api/viajes/[id]/completar alterna el estado.

TAREA 2. Verificación sin sesión: con npm run dev, GET /api/viajes y POST /api/viajes deben dar 401.

TAREA 3. Verificación con sesión: pídeme que inicie sesión. Con un deviceId de prueba en la query/cuerpo, crea un viaje por API (201), lístalo (GET), edítalo (PATCH), altérnale el estado (PATCH completar) y elimínalo (DELETE). Prueba crear uno con fin anterior al inicio (422 FECHA_FIN_ANTERIOR). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con probar:flujo (P04) y las verificaciones.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** las rutas dan 401 sin sesión; con sesión, crear un viaje por API devuelve 201 y uno con fechas invertidas devuelve 422.

**Commit sugerido:** `feat(api): rutas de viajes protegidas`

---

## P06 · Interfaz base, encabezado y lista de viajes

**Fase:** 5 · **Crea:** `components/ui/*`, layout de `/viajes`, lista con contador · **Modifica:** `app/globals.css`, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 4, 5, 10, 10.1, 10.2, 11 y 12), doc/ESTADO_ACTUAL.md (secciones 5, 9, 11), doc/ESTADO_EJECUCION.md, lib/dataService.ts y lib/formato.ts.

OBJETIVO: los componentes reutilizables, el encabezado, y la lista de viajes con su contador y el mensaje de lista vacía.

TAREA 1. Agrega los tokens de color de la sección 11 (la paleta del plan: azul océano #0B4F6C, dorado #F2A104, verde para completado) sin borrar nada existente: con Tailwind 4 en @theme de app/globals.css; con Tailwind 3 en tailwind.config.

TAREA 2. components/ui/: Boton (primario azul, secundario, peligro, fantasma; prop cargando), Campo, Tarjeta, Insignia (tono neutro, planeado, completado, acento), Aviso, Modal (fondo oscuro, cierre con Escape y botón, foco al abrir, role dialog), EstadoVacio. Foco visible y contraste.

TAREA 3. app/page.tsx: redirección a /viajes (si tiene contenido propio, añade un enlace a /viajes sin borrarlo).

TAREA 4. components/viajes/NavegacionViajes.tsx y app/viajes/layout.tsx (servidor): obtenerSesion(); sin sesión, redirect al login. Encabezado oscuro en azul océano con el título "Organizador de Viajes" (como el plan), el correo del usuario y el botón de cerrar sesión. Usa el deviceId en los componentes cliente.

TAREA 5. components/viajes/InsigniaEstado.tsx (Planeado neutro / Completado verde, siempre con texto); components/viajes/ContadorViajes.tsx ("Tienes N viajes"); components/viajes/TarjetaViaje.tsx (sección 10.1: destino, fechas inicio–fin con duración, presupuesto formateado, InsigniaEstado y tres botones Completar/Editar/Eliminar; la tarjeta completada se atenúa con opacidad); components/viajes/ListaViajes.tsx (cliente): al montar, GET /api/viajes?deviceId= y muestra las TarjetaViaje; EstadoVacio con el mensaje de la sección 10.2 cuando no hay viajes.

TAREA 6. app/viajes/page.tsx (servidor o cliente según convenga): por ahora muestra el ContadorViajes y la ListaViajes (el formulario se agrega en P07). Deja el espacio para el formulario arriba.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Para ver datos, puedes insertar un par de viajes con tu device_id real (te explico cómo: abre la consola del navegador en la app y mira localStorage 'viajes_device_id', o deja que P07 cree los primeros). Comprueba: el encabezado azul con el título; la lista vacía muestra el mensaje; el contador en 0. Revisa en móvil (tarjetas apiladas).

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver el encabezado azul océano, el contador y el mensaje de lista vacía; revisar en móvil.

**Commit sugerido:** `feat(interfaz): encabezado, lista de viajes y contador`

---

## P07 · Formulario, editar, eliminar, completar y aceptación

**Fase:** 5 y 6 · **Crea:** el formulario y las acciones de la tarjeta, `doc/ACEPTACION.md` · **Modifica:** `README.md`

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 5, 6, 6.1, 9.3, 10, 10.1, 10.2, 12, 13, 14 y 15), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: completar el CRUD en la interfaz (registrar, editar, eliminar con confirmación, completar) y cerrar el módulo mínimo con la aceptación.

TAREA 1. components/viajes/FormularioViaje.tsx (cliente), modos crear y editar:
- Campos: destino; fecha de inicio y fecha de fin (campos de fecha, en fila como el plan); presupuesto (número entero en pesos).
- Validación en vivo con las reglas de lib/reglas/viaje.ts: destino no vacío, fechas válidas, fin no anterior a inicio (muestra el mensaje de FECHA_FIN_ANTERIOR junto al campo de fecha de fin), presupuesto entero ≥ 0.
- Crear: POST /api/viajes con { deviceId, ...campos }; al guardar, limpia el formulario y refresca la lista. Botón "Guardar viaje".
- Editar: PATCH /api/viajes/[id]; botón "Actualizar viaje"; botón "Cancelar" que sale del modo edición.
- Muestra error.mensaje del servidor si la operación falla.

TAREA 2. app/viajes/page.tsx: el FormularioViaje en una tarjeta blanca arriba, y debajo el ContadorViajes y la ListaViajes (flujo del plan: formulario arriba, lista abajo). Al crear o editar, la lista se actualiza (router.refresh() o recarga de datos en el cliente).

TAREA 3. Edición: implementa el modo edición. Opción A (recomendada, fiel al plan): al presionar "Editar" en una TarjetaViaje, el formulario de arriba se llena con los datos del viaje y cambia a "Actualizar viaje"; al guardar, vuelve a modo crear. Opción B: una página app/viajes/[id]/editar/page.tsx con el formulario precargado. Elige una y documenta cuál.

TAREA 4. Acciones de la TarjetaViaje (componente cliente):
- Completar: PATCH /api/viajes/[id]/completar; la tarjeta cambia de estado y se atenúa (CU-05). Si ya está completado, el botón dice "Reactivar".
- Eliminar: abre un Modal de confirmación con el texto de la sección 10.2 (RN-04); solo al confirmar hace DELETE /api/viajes/[id] y refresca; "Cancelar" cierra sin borrar.
Tras cada acción, la lista y el contador se actualizan.

TAREA 5. Revisa el código contra las secciones 8.3, 12 y 13. Reporta y corrige en la bitácora: presupuesto tratado como decimal o string; operaciones que no filtren por device_id; rutas sin exigirSesion; eliminación sin confirmación; fechas mal comparadas; textos en inglés; estado comunicado solo con color; comentarios no en español (el plan pide código comentado en español).

TAREA 6. Ejecuta npm test y npm run probar:flujo; corrige fallas en el código. Prepara la aceptación: db:limpiar --prueba.

TAREA 7. Crea doc/ACEPTACION.md con la tabla A-01 a A-15 de la sección 14.3 (columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación; las tres últimas vacías) y una nota de que A-15 corresponde a la funcionalidad opcional (P08).

TAREA 8. Actualiza README.md: descripción; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, db:migrar, dev); scripts y su propósito; estructura de carpetas; nota de que los datos ahora viven en una base de datos (antes LocalStorage) y de que la fecha de fin no puede ser anterior a la de inicio; enlace a doc/PLAN_VIAJES.md. Como el plan original pedía comentarios en español, confirma que el código generado los tiene.

TAREA 9. Verifica que .env.local esté en .gitignore y que ningún archivo versionado tenga valores de variables de entorno.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md (interfaz) y doc/checkpoints/FASE_6_COMPLETADA.md (revisión y pruebas).
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que A-01 a A-14 se ejecutan en el despliegue de Vercel.
````

**Verificación del estudiante:** registrar un viaje, editarlo, marcarlo completado (se atenúa), e intentar eliminarlo (aparece la confirmación). Probar fin antes de inicio (se rechaza). Hacer push y ejecutar A-01 a A-14 en Vercel.

**Commit sugerido:** `feat(interfaz): formulario, editar, eliminar, completar y aceptación`

---

## P08 · Opcional: filtros, orden y resumen

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/PLAN_VIAJES.md (secciones 3.2, 9.3, 14.3 (A-15) y 16), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: filtrar y ordenar la lista (F6) y mostrar un resumen (F7).

TAREA 1. F6 · Filtros y orden:
- Verifica que listarViajes ya acepta estado y orden (se definió en P04); si no, complétalo.
- components/viajes/FiltrosViajes.tsx (cliente): un selector de estado (Todos / Planeado / Completado) y un selector de orden (Más reciente / Por fecha de inicio), reflejados en la URL.
- En app/viajes/page.tsx, la lista usa los filtros de la URL (searchParams es una Promise en Next.js 15 y 16).

TAREA 2. F7 · Resumen:
- app/api/viajes/resumen/route.ts: GET con exigirSesion() y el deviceId en la query; usa obtenerResumen.
- components/viajes/ResumenViajes.tsx: una tarjeta con total de viajes, cuántos planeados, cuántos completados y el presupuesto total (formateado). Colócala sobre la lista.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con varios viajes (algunos completados): filtra por Completado y comprueba que la lista responde; ordena por fecha de inicio; revisa que el resumen muestra los conteos y el presupuesto total correctos (verifica a mano la suma). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Agrega a doc/ACEPTACION.md el resultado de A-15.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** filtrar por estado y ordenar la lista; revisar que el resumen cuenta bien los viajes y suma el presupuesto.

**Commit sugerido:** `feat(opcional): filtros, orden y resumen de viajes`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/PLAN_VIAJES.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/PLAN_VIAJES.md y doc/PROMPTS_VIAJES.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel, o diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````
