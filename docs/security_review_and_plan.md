# Security Review and Improvements Plan

Este documento detiene los puntos de seguridad y áreas de mejora descubiertos en el proyecto, el plan para abordarlos, y el estado de avance. 

## Resumen de Problemas Detectados

1. **Reintentos en Conexión**: Falta de resiliencia en la API para sortear cortes temporales.
2. **Validación de Zod en la API**: Falta de comprobación estricta de las estructuras de datos JSON recibidos.
3. **Pérdida de Metadatos de Archivo**: `lazy pull` reemplaza archivos y pierde sus permisos originales (`chmod +x`).
4. **Limpieza Automática de Backups**: Multiples backups de carpetas se acumulan en disco sin un mecanismo de limpieza.
5. **Almacenamiento Inseguro de Credenciales**: El token JWT se guarda en texto plano (`credentials.json`).
6. **Flujo de Login Local Inseguro**: Falta restricción y validación estricta en el servidor temporal del CLI para recibir el Token.

## Plan de Ejecución y Ramas (Branches)

El trabajo será subdividido en ramas creadas a partir de la rama actual (`review`):

### 1. `feature/api-resilience`
- [ ] Implementar reintentos (retry mechansim) en llamadas de API (`api.ts`).
- [ ] Incorporar validaciones estrictas tipo `zod` para las respuestas JSON.
- [ ] Escribir test automatizados `api.test.ts`.

### 2. `feature/file-operations`
- [x] Implementar preservación del modo/permisos del archivo al sobrescribir `config-writer.ts`.
- [x] Desarrollar sistema de limpieza guardando un máximo de 5 copias antiguas en disco.
- [x] Escribir tests en `config-writer.test.ts`.

### 3. `feature/secure-auth`
- [ ] Utilizar `@node-rs/keyring` (multiplataforma) para el token `credentials.ts`.
- [ ] Restrigir `login.ts` para mitigar vulnerabilidades locales (limit at localhost interface).
- [ ] Implementar mecanismo de fallback si hay migración pendiente.
- [ ] Escribir tests correspondientes.

## Avances
- **Documentación Base**: ✔ Completada. En la rama `review`.
