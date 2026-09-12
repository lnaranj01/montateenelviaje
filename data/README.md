# /data — JSON Database Layer

Esta carpeta funciona como la capa de persistencia del sistema.
Cada archivo `.json` representa una colección.

## Reglas
- Un archivo por colección (singular, kebab-case)
- Cada archivo debe tener `_meta` y `records`
- IDs con prefijo de colección: `ex_001`, `usr_001`
