# Móntate en el viaje

Aplicación web para organizar viajes por dispositivo. Permite registrar un destino, sus fechas y presupuesto, revisar la lista, editar datos, marcar viajes como completados o reactivarlos y eliminarlos con confirmación.

## Funcionalidades

- Inicio de sesión con Supabase y página de viajes protegida.
- Formulario para crear y editar viajes con validación de destino, fechas y presupuesto.
- Lista con contador, duración, estado y presupuesto presentado en pesos colombianos.
- Completar, reactivar y eliminar viajes con confirmación.
- Persistencia de los registros en PostgreSQL. `localStorage` conserva solamente el identificador UUID del dispositivo.
- La fecha de fin no puede ser anterior a la fecha de inicio; un viaje de un solo día sí está permitido.

## Requisitos

- Node.js 20.9 o posterior y npm.
- Una instancia de Supabase y acceso a PostgreSQL.
- Variables de entorno configuradas en `.env.local` para el entorno local.

## Configuración local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea `.env.local` en la raíz y configura los nombres de variables requeridos. No publiques sus valores:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   POSTGRES_URL_NON_POOLING=
   PGSSLROOTCERT=
   ```

   Completa una sola de las variables de conexión PostgreSQL; no dejes una variable prioritaria vacía si vas a usar otra alternativa. También se aceptan `NEXT_PUBLIC_MONTATEENELVIAJESUPABASE_URL` y `NEXT_PUBLIC_MONTATEENELVIAJESUPABASE_PUBLISHABLE_KEY` para Supabase; para PostgreSQL se puede usar `POSTGRES_URL` o `POSTGRES_PRISMA_URL` en lugar de `POSTGRES_URL_NON_POOLING`. Los scripts de base de datos también aceptan `POSTGRES_HOST`, `POSTGRES_DATABASE`, `POSTGRES_USER` y `POSTGRES_PASSWORD`. `PGSSLROOTCERT` puede apuntar al certificado raíz de la base de datos; la conexión mantiene la validación TLS.

   El panel administrativo requiere `SUPABASE_SERVICE_ROLE_KEY`. El envío de correos es opcional y utiliza `RESEND_API_KEY` y `RESEND_FROM`. El script de desarrollo puede sincronizar `VERCEL_OIDC_TOKEN` desde Vercel; no agregues tokens ni claves al repositorio.

3. Aplica la migración de base de datos y ejecuta la aplicación:

   ```bash
   npm run db:migrar
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000) e inicia sesión para entrar al organizador.

## Pruebas y compilación

```bash
npm test
npm run type-check
npm run build
npm run probar:flujo
```

`npm run probar:flujo` usa PostgreSQL y limpia sus registros de prueba al finalizar. Para limpiar registros `dev-test-*` manualmente:

```bash
npm run db:limpiar -- --prueba
```

## Scripts disponibles

| Script                                | Propósito                                                                |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                         | Sincroniza el token local de Vercel si está disponible e inicia Next.js. |
| `npm run build` / `npm run start`     | Compila e inicia la aplicación en producción.                            |
| `npm test`                            | Ejecuta las pruebas con Vitest.                                          |
| `npm run type-check` / `npm run lint` | Comprueba TypeScript y ESLint.                                           |
| `npm run db:migrar`                   | Aplica la migración de viajes.                                           |
| `npm run db:verificar`                | Verifica el esquema y sus restricciones.                                 |
| `npm run probar:flujo`                | Prueba el flujo de datos contra PostgreSQL.                              |
| `npm run db:limpiar -- --prueba`      | Elimina únicamente los registros de prueba `dev-test-*`.                 |
| `npm run db:demo`                     | Carga cinco viajes bajo el dispositivo demo `dev-demo-0001`.             |
| `npm run db:limpiar -- --demo`        | Elimina únicamente los registros del dispositivo demo.                   |

## Estructura principal

```text
src/
  app/                 Rutas y páginas Next.js, incluida /viajes y su API
  components/ui/       Componentes reutilizables de interfaz
  components/viajes/   Formulario, lista, tarjetas y navegación de viajes
  lib/auth/            Sesión y autorización
  lib/datos/           Operaciones y tipos de viajes
  lib/db/              Conexión PostgreSQL
  lib/reglas/          Reglas de negocio y fechas
doc/
  PLAN_VIAJES.md       Requisitos y criterios de aceptación
  ACEPTACION.md        Registro de aceptación para el despliegue
```

La lógica nueva mantiene los identificadores y mensajes en español. El código de la interfaz no añade comentarios innecesarios; cuando un comentario de código sea necesario, debe escribirse en español.

Consulta el [plan funcional y técnico](./doc/PLAN_VIAJES.md) para las reglas, arquitectura y criterios de aceptación.
