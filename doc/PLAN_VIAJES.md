# Organizador de Viajes · Plan técnico de implementación

> Aplicación para planificar y dar seguimiento a viajes · versión técnica 1.0, derivada del plan funcional de Luis Daniel Naranjo (versión 1.0, HTML/CSS/JS + LocalStorage)
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta · Docente: Jhonatan Castro Polo
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_VIAJES.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida](#1-punto-de-partida)
2. [Traducción del stack del plan funcional](#2-traducción-del-stack-del-plan-funcional)
3. [Alcance](#3-alcance)
4. [Acceso y sesiones](#4-acceso-y-sesiones)
5. [Reglas de negocio](#5-reglas-de-negocio)
6. [Casos de uso](#6-casos-de-uso)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Arquitectura del código](#8-arquitectura-del-código)
9. [Contratos de API](#9-contratos-de-api)
10. [Pantallas](#10-pantallas)
11. [Identidad visual](#11-identidad-visual)
12. [Fechas, dinero y zona horaria](#12-fechas-dinero-y-zona-horaria)
13. [Seguridad e integridad](#13-seguridad-e-integridad)
14. [Pruebas](#14-pruebas)
15. [Plan de ejecución](#15-plan-de-ejecución)
16. [Funcionalidades opcionales](#16-funcionalidades-opcionales)
17. [Glosario](#17-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_VIAJES.md` | Este documento |
| `doc/PROMPTS_VIAJES.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida

### 1.1 Lo que ya existe y no se reconstruye

- Proyecto Next.js con TypeScript desplegado en Vercel.
- Proyecto Supabase conectado al despliegue.
- Login funcionando.
- Variables de entorno en `.env.local` (local) y en el proyecto de Vercel (producción).

### 1.2 Lo que se verifica en P00 antes de escribir código

| Aspecto | Por qué importa |
|---|---|
| Mecanismo del login | El adaptador `lib/auth/sesion.ts` debe envolverlo sin reescribirlo |
| Ruta a la que redirige el login | Se cambia a `/viajes` |
| Archivo de middleware existente | En Next.js 16 se llama `proxy.ts`; en versiones anteriores, `middleware.ts` |
| Variable de conexión directa a Postgres | Las operaciones usan transacciones con `pg`; si no existe, se obtiene en P00 |
| Mecanismo de migraciones existente | Las tablas nuevas se aplican con ese mecanismo; si no existe, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 11) |
| Rutas `/viajes` o `/api/viajes` | No deben existir antes; si existen, se reporta el conflicto |
| Tabla previa llamada `viajes` | Si existe, se reporta su estructura antes de crear la nueva |

### 1.3 Regla sobre el login

El plan funcional describe un solo usuario sin cuentas: los viajes viven en el navegador (LocalStorage). En el stack del curso la aplicación queda publicada en una URL de Vercel y los datos pasan a una base de datos compartida; dejarla abierta expondría los viajes a cualquiera. Se usa el login existente como puerta única de acceso, sin agregar roles: una sola persona entra y gestiona sus viajes, como en el plan original, pero protegido y con los datos en una base real en lugar del navegador. El login no se reescribe; solo se agrega el adaptador `lib/auth/sesion.ts` (`obtenerSesion`, `exigirSesion`), la protección de `/viajes/*` y `/api/viajes/*`, y la redirección posterior al login hacia `/viajes`.

---

## 2. Traducción del stack del plan funcional

El plan funcional está pensado para HTML + CSS + JavaScript vanilla con LocalStorage, de un primer proyecto. La conversión al stack del curso conserva toda la lógica y las reglas; cambia dónde viven los datos y cómo se sirve la interfaz.

| Pieza del plan funcional | En este plan técnico | Motivo |
|---|---|---|
| HTML + CSS + JS vanilla | Next.js (App Router) + TypeScript + Tailwind | Es el stack del curso y ya está desplegado |
| LocalStorage (clave `"viajes"`) | Supabase Postgres (tabla `viajes`) | Datos que persisten en una base real, no atados a un navegador |
| `obtenerViajes()` / `guardarViajes()` leyendo LocalStorage | Funciones de `lib/datos/viajes.ts` con SQL | Mismo papel de "capa de datos" que el plan ya nombraba, ahora contra Postgres |
| `id` como marca de tiempo (`Date.now()`) | UUID generado por la base | Identificador único robusto, sin colisiones |
| `presupuesto` como string en el objeto | Entero en pesos (`INTEGER`) | El peso no usa centavos; los enteros evitan errores de redondeo |
| Reescribir el arreglo completo en cada cambio | Operaciones puntuales (INSERT, UPDATE, DELETE) por viaje | Más simple y seguro con una base real |
| Un navegador = un usuario | Login como puerta + `device_id` para agrupar los viajes de cada dispositivo sin cuenta | Cumple "sin cuentas" dentro de una app protegida (sección 4) |

Lo que **no cambia**: los campos del viaje, el estado Planeado/Completado, la confirmación al eliminar, el contador de viajes, el mensaje de lista vacía, la paleta de colores y los flujos de usuario. El plan funcional de Luis Daniel se respeta en todo lo demás.

---

## 3. Alcance

### 3.1 Módulo mínimo

| ID | Funcionalidad (plan funcional) | Requerimientos | Casos de uso | Prompts |
|---|---|---|---|---|
| F1 | Registrar un viaje (destino, fechas, presupuesto) | RF-01, RF-06 | CU-01 | P04, P05, P07 |
| F2 | Ver la lista de viajes con contador y mensaje de vacío | RF-02, RF-07, RF-08 | CU-02 | P04, P05, P06 |
| F3 | Editar un viaje existente | RF-03 | CU-03 | P04, P05, P07 |
| F4 | Eliminar un viaje con confirmación | RF-04 | CU-04 | P04, P05, P07 |
| F5 | Alternar el estado entre Planeado y Completado | RF-05 | CU-05 | P02, P04, P07 |

Todo el plan funcional es el módulo mínimo: es un proyecto acotado y coherente. No hay funcionalidades opcionales en el plan original.

### 3.2 Funcionalidades opcionales (añadidas en esta versión técnica)

| ID | Funcionalidad | Prompts |
|---|---|---|
| F6 | Filtrar y ordenar la lista (por estado, por fecha de inicio) | P08 |
| F7 | Resumen: número de viajes planeados y completados, y presupuesto total | P08 |

Son extensiones naturales que el plan menciona como deseables implícitamente (contador) y que enriquecen la demostración. Se construyen solo con la fase 5 cerrada. El "trabajo futuro" del plan (itinerario día por día, compartir, exportar, múltiples cuentas) queda fuera de alcance, igual que en el original.

### 3.3 Fuera de alcance

Se mantiene la lista del plan funcional (sección 16): autenticación con múltiples cuentas, itinerario detallado día por día, compartir viajes entre personas, exportar a PDF o Excel, y sincronización entre dispositivos más allá del `device_id`.

### 3.4 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| Se agrega la regla de que la fecha de fin no sea anterior a la de inicio | El dominio lo pide (un viaje no termina antes de empezar); es el tipo de validación que da valor a un plan de viajes, y el original no la tenía |
| El presupuesto se guarda en pesos enteros | Coherente con el peso colombiano; el plan ya lo describía "en pesos colombianos" |
| Los viajes se agrupan por `device_id` | Reproduce el "un navegador, sus viajes" del plan, ahora con los datos en la base |
| Editar y eliminar operan sobre un viaje por su id | Más simple y seguro que reescribir todo el arreglo |
| La fecha de inicio puede ser pasada | El plan no lo prohíbe; alguien puede registrar un viaje ya hecho y marcarlo completado |

---

## 4. Acceso y sesiones

| Actor | Acceso | Puede hacer |
|---|---|---|
| Viajero | Login existente como puerta | Registrar, ver, editar, eliminar y completar sus viajes |
| Sistema | Interno | Valida el formulario, calcula el contador y el resumen, guarda y lee en Postgres |

| Ruta | Sin sesión | Con sesión |
|---|:-:|:-:|
| `/` | Redirige al login | Redirige a `/viajes` |
| `/viajes/*` | Redirige al login | Sí |
| `/api/viajes/*` | 401 | Sí |

Los viajes de cada dispositivo se agrupan con un `device_id` (UUID en localStorage, `lib/deviceId.ts`), reproduciendo el modelo "sin cuentas" del plan dentro de una app protegida por login. No hay datos personales: un viaje es solo destino, fechas, presupuesto y estado.

---

## 5. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | Todos los campos (destino, fecha de inicio, fecha de fin, presupuesto) son obligatorios | RN-01 del plan | `lib/reglas/viaje.ts`; Zod; BD NOT NULL |
| RN-02 | El presupuesto es un número entero mayor o igual a 0 | RN-02 del plan | `lib/reglas/viaje.ts`; Zod; BD CHECK |
| RN-03 | Cada viaje tiene un id único generado automáticamente al crearlo | RN-03 del plan | BD UUID por defecto |
| RN-04 | Eliminar un viaje exige confirmación explícita antes de borrarlo | RN-04 del plan | Interfaz (modal de confirmación) |
| RN-05 | Un viaje nuevo se crea con estado "Planeado" (no completado) | RN-05 del plan | Servicio `crearViaje`; BD DEFAULT |
| RN-06 | El destino no puede estar vacío (mínimo 2 caracteres tras recortar) | RN-01 del plan, precisado | `lib/reglas/viaje.ts`; Zod; BD CHECK |
| RN-07 | Las fechas tienen formato `YYYY-MM-DD` y son fechas reales | Agregada | `lib/reglas/fechas.ts`; Zod |
| RN-08 | La fecha de fin no puede ser anterior a la de inicio (sí puede ser igual: viaje de un día) | Agregada (sección 3.4) | `lib/reglas/viaje.ts`; BD CHECK |
| RN-09 | El estado es "Planeado" o "Completado"; se alterna entre ambos | RF-05, RN-05 del plan | BD CHECK; `lib/reglas/viaje.ts` |
| RN-10 | Solo se ven y editan los viajes del `device_id` actual | Agregada (sección 4) | Servicio; filtro en todas las consultas |
| RN-11 | El contador muestra el número total de viajes del dispositivo; si es 0, se muestra el mensaje de lista vacía | RF-07, RF-08 del plan | `lib/datos/viajes.ts`; interfaz |

### 5.1 Validaciones frente a reglas de negocio

| Validación (rechaza datos mal formados) | Regla de negocio (decisión del dominio) |
|---|---|
| El presupuesto debe ser un entero ≥ 0 | Un viaje nuevo siempre nace "Planeado" |
| El destino no puede estar vacío | La fecha de fin no puede ser anterior a la de inicio |
| Las fechas deben tener formato válido | Solo se ven los viajes del propio dispositivo |

---

## 6. Casos de uso

| ID | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|
| CU-01 Registrar viaje | device_id, destino, fecha inicio, fecha fin, presupuesto | — | Viaje creado, estado "Planeado" | `DATOS_INVALIDOS`, `FECHA_FIN_ANTERIOR` |
| CU-02 Ver lista | device_id | — | Lista de viajes del dispositivo con contador, o mensaje de vacío | — |
| CU-03 Editar viaje | device_id, id, campos | el viaje existe y es del dispositivo | Viaje actualizado | `VIAJE_NO_ENCONTRADO`, `DATOS_INVALIDOS`, `FECHA_FIN_ANTERIOR` |
| CU-04 Eliminar viaje | device_id, id | el viaje existe y es del dispositivo | Viaje eliminado (tras confirmación en la interfaz) | `VIAJE_NO_ENCONTRADO` |
| CU-05 Completar / reactivar viaje | device_id, id | el viaje existe y es del dispositivo | Estado alternado entre Planeado y Completado | `VIAJE_NO_ENCONTRADO` |

### 6.1 Secuencia de CU-01 (registrar viaje)

```ts
export async function crearViaje(deviceId: string, d: DatosViaje): Promise<Viaje> {
  validarViaje(d);  // RN-01, RN-02, RN-06, RN-07, RN-08
  const fila = await insertarViaje(deviceId, {
    destino: d.destino.trim(),
    fechaInicio: d.fechaInicio,
    fechaFin: d.fechaFin,
    presupuesto: d.presupuesto,
    completado: false,   // RN-05
  });
  return fila;
}
```

`validarViaje` concentra las reglas: destino no vacío (RN-06), fechas válidas (RN-07), fin no anterior a inicio (RN-08), presupuesto entero ≥ 0 (RN-02). Editar (CU-03) reutiliza la misma validación.

---

## 7. Modelo de datos

### 7.1 Una sola tabla

El proyecto maneja una sola entidad, el viaje. No hay relaciones; por eso no hay vista ni funciones de base complejas.

```text
viajes (todas las filas de un device_id son "los viajes de ese dispositivo")
```

La migración se guarda en `supabase/migrations/` y continúa la numeración existente (P00 la identifica). En este documento se nombra M1.

### 7.2 M1 · Tabla y seguridad

```sql
-- M1: tabla de viajes y cierre de acceso público

CREATE TABLE IF NOT EXISTS viajes (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),   -- RN-03
  device_id     VARCHAR(64)   NOT NULL,                                -- agrupa los viajes del dispositivo
  destino       VARCHAR(160)  NOT NULL,
  fecha_inicio  DATE          NOT NULL,
  fecha_fin     DATE          NOT NULL,
  presupuesto   INTEGER       NOT NULL,                                -- pesos enteros
  completado    BOOLEAN       NOT NULL DEFAULT false,                  -- RN-05
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT viajes_destino_minimo   CHECK (char_length(btrim(destino)) >= 2),   -- RN-06
  CONSTRAINT viajes_presupuesto_ok   CHECK (presupuesto >= 0),                   -- RN-02
  CONSTRAINT viajes_fechas_ok        CHECK (fecha_fin >= fecha_inicio)           -- RN-08
);
CREATE INDEX IF NOT EXISTS idx_viajes_device ON viajes (device_id, created_at DESC);

CREATE OR REPLACE FUNCTION viajes_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_viajes_updated_at ON viajes;
CREATE TRIGGER trg_viajes_updated_at BEFORE UPDATE ON viajes
  FOR EACH ROW EXECUTE FUNCTION viajes_actualizar_updated_at();

ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON viajes FROM anon, authenticated;
```

La tabla queda sin políticas: la clave pública de Supabase no puede leerla ni escribirla. Todo el acceso ocurre en el servidor mediante la conexión directa a Postgres.

### 7.3 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23514` | `viajes_fechas_ok` | `FECHA_FIN_ANTERIOR` |
| `23514` | cualquier otro CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 8. Arquitectura del código

### 8.1 Capas

```text
Pantallas (app/viajes/*) ───┐
                            ├──► Rutas API (app/api/viajes/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ─┘          │                              │
                                       └──── lib/validacion (Zod)     └──── lib/reglas/* (funciones puras)
```

- `lib/reglas/`: reglas puras (validación del viaje, comparación de fechas). No importan `pg`, ni red, ni el reloj (salvo `fechas.ts`). Se prueban con Vitest. El plan funcional ya hablaba de una "capa de datos" separada; aquí además la lógica de validación se separa para poder probarla sin la base.
- `lib/datos/`: consultas SQL. Solo este directorio importa `lib/db/conexion.ts`. Cumple el papel de `obtenerViajes`/`guardarViajes` del plan, contra Postgres.
- `lib/dataService.ts`: fachada única. Las rutas y páginas importan datos solo desde aquí.
- Rutas API: validan con Zod, verifican sesión, llaman a `dataService` y responden con `lib/http/respuestas.ts`.

### 8.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_viajes_tabla.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

lib/config/viajes.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/viaje.ts
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesion.ts
lib/http/respuestas.ts
lib/formato.ts
lib/deviceId.ts
lib/hooks/useDeviceId.ts
lib/datos/tipos.ts
lib/datos/viajes.ts
lib/dataService.ts

tests/reglas/ayudas.ts
tests/reglas/viaje.test.ts
tests/reglas/fechas.test.ts
vitest.config.ts

app/page.tsx                                  (redirige a /viajes)
app/viajes/layout.tsx
app/viajes/page.tsx                           (lista + formulario)
app/viajes/nuevo/page.tsx                     (o un modal; ver pantallas)
app/viajes/[id]/editar/page.tsx

app/api/viajes/sesion/route.ts
app/api/viajes/route.ts                       (GET lista por device, POST crear)
app/api/viajes/[id]/route.ts                  (GET uno, PATCH editar, DELETE)
app/api/viajes/[id]/completar/route.ts        (PATCH alternar estado)
app/api/viajes/resumen/route.ts               (opcional, F7)

components/ui/Boton.tsx
components/ui/Campo.tsx
components/ui/Tarjeta.tsx
components/ui/Insignia.tsx
components/ui/Aviso.tsx
components/ui/Modal.tsx
components/ui/EstadoVacio.tsx
components/viajes/NavegacionViajes.tsx
components/viajes/FormularioViaje.tsx
components/viajes/TarjetaViaje.tsx
components/viajes/ListaViajes.tsx
components/viajes/InsigniaEstado.tsx
components/viajes/ContadorViajes.tsx
components/viajes/FiltrosViajes.tsx           (opcional, F6)
components/viajes/ResumenViajes.tsx           (opcional, F7)
```

### 8.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio y con el RNF-02 del plan (código comentado en español) |
| Las reglas puras viven en `lib/reglas/` y no tocan la base ni la red | Se prueban con Vitest |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única |
| Toda ruta `/api/viajes/*` llama `exigirSesion()` como primera instrucción | Sección 1.3 |
| Toda operación de datos filtra por `device_id` | RN-10 |
| El presupuesto se maneja como entero en pesos; nunca decimales ni string | Sección 2, 12 |
| Fechas como texto `YYYY-MM-DD` entre capas | Evita errores de zona horaria (sección 12) |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js 15 y 16 entregan `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 8.4 Configuración

```ts
// lib/config/viajes.ts
export const ESTADOS = ['Planeado', 'Completado'] as const;
export const DESTINO_MIN = 2;
export const DESTINO_MAX = 160;
export const PRESUPUESTO_MINIMO = 0;        // RN-02
export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_LISTADO = 500;
```

### 8.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'VIAJE_NO_ENCONTRADO' | 'FECHA_FIN_ANTERIOR' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 9.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 9.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export function esFechaValida(fecha: string): boolean;              // formato YYYY-MM-DD y fecha real
export function finNoAnteriorAInicio(inicio: string, fin: string): boolean;   // fin >= inicio (comparación de texto YYYY-MM-DD)
export function duracionDias(inicio: string, fin: string): number; // días inclusive, para mostrar

// lib/reglas/viaje.ts
export type EstadoViaje = 'Planeado' | 'Completado';
export function validarViaje(d: {
  destino: string; fechaInicio: string; fechaFin: string; presupuesto: number;
}): void;
// destino recortado >= DESTINO_MIN (DATOS_INVALIDOS); fechas válidas (DATOS_INVALIDOS);
// fin no anterior a inicio (FECHA_FIN_ANTERIOR); presupuesto entero >= 0 (DATOS_INVALIDOS)
export function alternarEstado(completado: boolean): boolean;       // !completado
export function etiquetaEstado(completado: boolean): EstadoViaje;   // completado ? 'Completado' : 'Planeado'
```

### 8.6 Firmas de `dataService`

```ts
// Sesión
obtenerSesion(): Promise<{ email: string } | null>

// Viajes (todos filtrados por device_id)
listarViajes(deviceId: string, f?: { estado?: EstadoViaje; orden?: 'inicio' | 'reciente' }): Promise<Viaje[]>
contarViajes(deviceId: string): Promise<number>
obtenerViaje(deviceId: string, id: string): Promise<Viaje>              // VIAJE_NO_ENCONTRADO
crearViaje(deviceId: string, d: DatosViaje): Promise<Viaje>
editarViaje(deviceId: string, id: string, d: DatosViaje): Promise<Viaje>
eliminarViaje(deviceId: string, id: string): Promise<void>
alternarCompletado(deviceId: string, id: string): Promise<Viaje>
obtenerResumen(deviceId: string): Promise<ResumenViajes>               // opcional, F7
```

Tipos (`lib/datos/tipos.ts`):

```ts
interface Viaje {
  id: string; destino: string; fechaInicio: string; fechaFin: string;
  presupuesto: number; completado: boolean; estado: EstadoViaje; duracionDias: number;
}
interface DatosViaje { destino: string; fechaInicio: string; fechaFin: string; presupuesto: number }
interface ResumenViajes { total: number; planeados: number; completados: number; presupuestoTotal: number }
```

### 8.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (COUNT) → number

const globalParaPool = globalThis as unknown as { poolViajes?: Pool };

export const pool = globalParaPool.poolViajes ?? new Pool({
  connectionString: process.env.DATABASE_URL,        // el nombre real lo confirma P00
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolViajes = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }
export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> { /* BEGIN/COMMIT/ROLLBACK */ }
```

Como cada operación afecta un solo viaje, casi no se necesitan transacciones de varios pasos; `conTransaccion` queda disponible por consistencia con el patrón del curso, pero las operaciones simples pueden usar `consultar` directamente.

---

## 9. Contratos de API

### 9.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "FECHA_FIN_ANTERIOR", "mensaje": "La fecha de fin no puede ser anterior a la de inicio.", "detalles": null } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 9.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión. |
| `VIAJE_NO_ENCONTRADO` | 404 | El viaje no existe. |
| `FECHA_FIN_ANTERIOR` | 422 | La fecha de fin no puede ser anterior a la de inicio. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

### 9.3 Endpoints (todos requieren sesión)

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/viajes/sesion` | | `{ email }` |
| `GET /api/viajes?deviceId=&estado=&orden=` | | `{ viajes: Viaje[], total: number }` |
| `POST /api/viajes` | `{ deviceId, destino, fechaInicio, fechaFin, presupuesto }` | `Viaje` (201) |
| `GET /api/viajes/[id]?deviceId=` | | `Viaje` |
| `PATCH /api/viajes/[id]` | `{ deviceId, destino, fechaInicio, fechaFin, presupuesto }` | `Viaje` |
| `DELETE /api/viajes/[id]` | `{ deviceId }` | `{ eliminado: true }` |
| `PATCH /api/viajes/[id]/completar` | `{ deviceId }` | `Viaje` (estado alternado) |
| `GET /api/viajes/resumen?deviceId=` | | `ResumenViajes` (opcional, F7) |

Todas las rutas reciben el `deviceId` (UUID) y operan solo sobre los viajes de ese dispositivo (RN-10).

### 9.4 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaDeviceId` | UUID |
| `esquemaViaje` | destino (recortado, 2 a 160), fechaInicio y fechaFin (formato fecha), presupuesto entero ≥ 0 (`z.coerce.number().int().min(0)`) |
| `esquemaFiltros` | estado opcional (enum Planeado/Completado), orden opcional (enum inicio/reciente) |

La comparación fin ≥ inicio la hace `lib/reglas/viaje.ts`, porque relaciona dos campos; la base la refuerza con el CHECK.

---

## 10. Pantallas

El plan funcional es de una sola página (formulario arriba, lista abajo). Se conserva esa idea: la vista principal tiene el formulario y la lista juntos; la edición puede ser un modal o una página aparte.

| Ruta | Contenido |
|---|---|
| `/` | Redirige a `/viajes`. |
| Layout `/viajes` | Verifica la sesión; sin sesión redirige al login. Encabezado oscuro con "Organizador de Viajes" (como el plan), correo del usuario y botón de cerrar sesión. Usa `useDeviceId`. |
| `/viajes` · Principal | Arriba, `FormularioViaje` en una tarjeta blanca (destino, fecha de inicio y fecha de fin en fila, presupuesto, botón "Guardar viaje"). Debajo, `ContadorViajes` ("Tienes N viajes") y `ListaViajes` con una `TarjetaViaje` por viaje. `EstadoVacio` con el mensaje de lista vacía cuando no hay viajes (RF-08). Si F6/F7 están activos, `FiltrosViajes` y `ResumenViajes` arriba de la lista. |
| `/viajes/[id]/editar` · Editar | `FormularioViaje` en modo edición, precargado con los datos del viaje; botón "Actualizar viaje". (Alternativa: el formulario principal entra en modo edición sin cambiar de página; el equipo elige, pero el flujo del plan es "el formulario se llena con los datos actuales".) |

### 10.1 TarjetaViaje

Cada tarjeta muestra, como en el plan: destino, fechas (inicio – fin) y duración en días, presupuesto formateado, `InsigniaEstado` (badge de color: Planeado neutro, Completado verde) y tres botones: **Completar** (o "Reactivar" si ya está completado), **Editar**, **Eliminar**. Una tarjeta completada se atenúa visualmente (CU-05). Eliminar abre un `Modal` de confirmación (RN-04); solo al confirmar se borra.

### 10.2 Textos fijos

Mensaje de lista vacía:

> Aún no has registrado viajes. Completa el formulario de arriba para agregar el primero.

Confirmación de eliminación:

> ¿Eliminar el viaje a {destino}? Esta acción no se puede deshacer.

---

## 11. Identidad visual

Se respeta la paleta del plan funcional.

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#0B4F6C` | Azul océano: encabezado, botones principales |
| `--color-primario-suave` | `#E3EEF2` | Fondos de selección, hover |
| `--color-acento` | `#F2A104` | Dorado: detalles, foco |
| `--color-completado` | `#2F7D4F` | Verde: estado Completado |
| `--color-planeado` | `#5B6770` | Estado Planeado |
| `--color-peligro` | `#B83232` | Eliminar, errores |
| `--color-fondo` | `#F4F6F7` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9DEE4` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

Criterios: el encabezado va en azul océano con texto claro (como el plan); el presupuesto con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`; las fechas con `Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })` sobre fechas `YYYY-MM-DD`; el estado nunca se comunica solo con color (la insignia lleva texto); la tarjeta completada se atenúa con opacidad; bordes redondeados de 8 px; sin emojis; funciona en computador (RNF-03) y también en móvil con tarjetas apiladas.

---

## 12. Fechas, dinero y zona horaria

| Regla | Implementación |
|---|---|
| Fechas entre capas | Texto `YYYY-MM-DD`; validadas con `esFechaValida` |
| Comparación fin ≥ inicio | Comparación de texto `YYYY-MM-DD` (orden lexicográfico equivale al cronológico en ese formato) y CHECK en la base (RN-08) |
| Presupuesto | Pesos enteros (`INTEGER`), sin centavos; presentación con `Intl.NumberFormat` es-CO |
| Duración en días | `duracionDias` con `Date.UTC` sobre ambas fechas, inclusive (un viaje del 10 al 15 dura 6 días) |
| Fecha por defecto en el formulario | Las fechas las elige el viajero; no hay "hoy" que decida una regla |

El plan no tiene reglas que dependan de "hoy" (no hay vencimientos), así que la zona horaria solo afecta la presentación. Las fechas se muestran con `timeZone: 'UTC'` sobre el texto `YYYY-MM-DD` para que no se corran un día.

---

## 13. Seguridad e integridad

| Medida | Detalle |
|---|---|
| Acceso solo con sesión | Middleware o proxy existente y `exigirSesion()` en cada ruta de `/api/viajes` |
| Viajes acotados al dispositivo | El servidor solo opera sobre los viajes del `device_id` recibido (RN-10) |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Validación en tres puntos | Formulario (Zod y reglas), API (Zod y reglas) y base (CHECK, NOT NULL) |
| Confirmación antes de eliminar | Modal en la interfaz (RN-04); el borrado solo ocurre tras confirmar |
| SQL parametrizado | Ningún valor se concatena |
| Errores internos | Se registran con `console.error`; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

Nota de alcance: como no hay cuentas y los viajes se agrupan por `device_id` (un UUID), no hay datos personales en juego; el riesgo de que otro dispositivo vea estos viajes es nulo en la práctica.

---

## 14. Pruebas

### 14.1 Pruebas unitarias de reglas (Vitest)

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `esFechaValida` | "2026-12-10" | `true` |
| T-02 | `esFechaValida` | "2026-13-10" | `false` |
| T-03 | `esFechaValida` | "10/12/2026" | `false` |
| T-04 | `finNoAnteriorAInicio` | inicio "2026-12-10", fin "2026-12-15" | `true` |
| T-05 | `finNoAnteriorAInicio` | inicio "2026-12-10", fin "2026-12-10" | `true` (viaje de un día) |
| T-06 | `finNoAnteriorAInicio` | inicio "2026-12-15", fin "2026-12-10" | `false` |
| T-07 | `duracionDias` | "2026-12-10", "2026-12-15" | 6 (inclusive) |
| T-08 | `duracionDias` | "2026-12-10", "2026-12-10" | 1 |
| T-09 | `validarViaje` | destino " " | `DATOS_INVALIDOS` |
| T-10 | `validarViaje` | destino "A" (1 carácter) | `DATOS_INVALIDOS` |
| T-11 | `validarViaje` | presupuesto -1 | `DATOS_INVALIDOS` |
| T-12 | `validarViaje` | presupuesto 1500.5 | `DATOS_INVALIDOS` |
| T-13 | `validarViaje` | presupuesto 0 | sin error (RN-02 permite 0) |
| T-14 | `validarViaje` | fechaInicio "2026-02-30" | `DATOS_INVALIDOS` |
| T-15 | `validarViaje` | fin anterior a inicio | `FECHA_FIN_ANTERIOR` |
| T-16 | `validarViaje` | destino "Cartagena", 2026-12-10 a 2026-12-15, 1500000 | sin error |
| T-17 | `alternarEstado` | false / true | true / false |
| T-18 | `etiquetaEstado` | false / true | 'Planeado' / 'Completado' |

Comando: `npm test`. Las 18 pruebas deben pasar antes de continuar con la fase 3.

### 14.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` con un `deviceId` de prueba. Imprime `OK` o `FALLA` por paso y limpia al final.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Contar viajes del device (limpio) | 0 |
| 2 | Crear "Prueba Cartagena" 2026-12-10 a 2026-12-15, 1500000 | Creado, Planeado |
| 3 | Crear con fin anterior al inicio | `FECHA_FIN_ANTERIOR` |
| 4 | Crear con presupuesto -1 | `DATOS_INVALIDOS` |
| 5 | Crear con destino vacío | `DATOS_INVALIDOS` |
| 6 | Listar viajes del device | 1 viaje; contador 1 |
| 7 | Editar el viaje: presupuesto 2000000 | Actualizado |
| 8 | Alternar completado | Pasa a Completado |
| 9 | Alternar de nuevo | Vuelve a Planeado |
| 10 | Crear un segundo viaje "Prueba Medellín" | 2 viajes |
| 11 | Resumen del device | total 2, planeados 2, completados 0, presupuesto sumado |
| 12 | Obtener un viaje por un id inexistente | `VIAJE_NO_ENCONTRADO` |
| 13 | Eliminar el primer viaje | Queda 1 viaje |
| 14 | Editar un viaje de otro device_id (ajeno) | `VIAJE_NO_ENCONTRADO` (aislamiento por device, RN-10) |

### 14.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md`.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Abrir `/viajes` sin sesión | Redirección al login |
| A-02 | Con la lista vacía, ver la pantalla | Mensaje de lista vacía y contador en 0 |
| A-03 | Registrar "Cartagena" 10/12 a 15/12, $1.500.000 | Aparece en la lista; contador 1; estado Planeado |
| A-04 | Intentar un viaje con fin antes del inicio | Rechazo con mensaje claro |
| A-05 | Intentar presupuesto negativo | Rechazo con mensaje |
| A-06 | Intentar guardar con un campo vacío | Rechazo (campos obligatorios) |
| A-07 | Registrar un segundo viaje "Medellín" | Contador 2 |
| A-08 | Marcar "Cartagena" como Completado | La tarjeta se atenúa y el badge cambia a verde |
| A-09 | Reactivar "Cartagena" | Vuelve a Planeado |
| A-10 | Editar "Medellín" cambiando el presupuesto | Se guarda el nuevo valor |
| A-11 | Eliminar "Medellín": aparece la confirmación | Se pide confirmar antes de borrar (RN-04) |
| A-12 | Confirmar la eliminación | El viaje desaparece; contador 1 |
| A-13 | Cancelar una eliminación | El viaje permanece |
| A-14 | Cerrar el navegador y volver a entrar | Los viajes persisten (base de datos, no LocalStorage) |
| A-15 | (Opcional) Filtrar por Completados y ver el resumen | La lista y el resumen responden a los filtros |

A-15 corresponde a las funcionalidades opcionales; se verifica tras P08.

---

## 15. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Preparación | P00 | `ESTADO_ACTUAL.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; compilación de base | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 aplicada; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas`, 18 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión, device_id, respuestas, esquemas, formato; `/api/viajes/sesion` protegido | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/viajes.ts`, `dataService`, rutas; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz | P06, P07 | Componentes base, lista con contador, formulario, editar, eliminar, completar | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación | (en P07) | `ACEPTACION.md` con A-01 a A-14; README | `FASE_6_COMPLETADA.md` |
| 7 · Opcional | P08 | Filtros, orden y resumen | `FASE_7_COMPLETADA.md` |

Condiciones entre fases: no se inicia una fase sin el archivo de cierre de la anterior; `npm run build` sin errores al final de cada prompt; `npm test` en verde desde P02; cada prompt termina con commit y push, y un fallo de despliegue en Vercel se corrige antes del siguiente prompt.

---

## 16. Funcionalidades opcionales

Se construyen solo con la fase 6 cerrada.

| Prompt | Funcionalidad | Implementación |
|---|---|---|
| P08 | F6 · Filtrar y ordenar | `listarViajes` acepta `estado` (Planeado/Completado) y `orden` (por fecha de inicio o por más reciente); `FiltrosViajes` refleja la selección en la URL; la lista responde en el servidor |
| P08 | F7 · Resumen | `obtenerResumen(deviceId)` devuelve total, planeados, completados y presupuesto total (suma de todos los viajes del dispositivo); `GET /api/viajes/resumen`; `ResumenViajes` en una tarjeta sobre la lista |

El "trabajo futuro" del plan (itinerario día por día, compartir, exportar, múltiples cuentas, migración de framework) queda fuera; la migración de framework, de hecho, es justo lo que hace este plan técnico.

---

## 17. Glosario

| Término | Definición |
|---|---|
| Viaje | Registro de un destino con fechas, presupuesto y estado |
| Estado del viaje | Planeado o Completado |
| device_id | UUID guardado en localStorage que agrupa los viajes del dispositivo, sin cuenta |
| Duración | Días del viaje, contados de forma inclusiva (del 10 al 15 son 6 días) |
| Presupuesto | Valor estimado del viaje, en pesos enteros |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Contador | Número total de viajes del dispositivo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |
