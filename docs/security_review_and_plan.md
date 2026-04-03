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
- [x] Implementar reintentos (retry mechansim) en llamadas de API (`api.ts`).
- [x] Incorporar validaciones estrictas tipo `zod` para las respuestas JSON.
- [x] Escribir test automatizados `api.test.ts`.

### 2. `feature/file-operations`
- [x] Implementar preservación del modo/permisos del archivo al sobrescribir `config-writer.ts`.
- [x] Desarrollar sistema de limpieza guardando un máximo de 5 copias antiguas en disco.
- [x] Escribir tests en `config-writer.test.ts`.

### 3. `feature/secure-auth`
- [x] Utilizar `@node-rs/keyring` o `keytar` (multiplataforma) para el token `credentials.ts`.
- [x] Restrigir `login.ts` para mitigar vulnerabilidades locales (limit at localhost interface).
- [x] Implementar mecanismo de fallback si hay migración pendiente.
- [x] Escribir tests correspondientes.

## Avances
- **Documentación Base**: ✔ Completada. En la rama `review`.
- **API Resilience**: ✔ Completada. En la rama `feature/api-resilience`.
- **File Operations**: ✔ Completada. En la rama `feature/file-operations`.
- **Secure Auth**: ✔ Completada. En la rama `feature/secure-auth`.

## Decisiones de Arquitectura y Estándares de Industria

Durante la implementación, se introdujeron cambios para alinear el CLI con las mejores prácticas de ciberseguridad, en particular:

### 1. Uso de `keytar` para Almacenamiento Seguro
Antes, los tokens (JWT) se guardaban en texto plano en un archivo `.json` en el disco. Actualmente estamos usando `keytar` como adaptador para el **Keychain nativo**.
- **Por qué `keytar`:** A pesar de haber sido etiquetado recientemente como descontinuado en GitHub, la mayoría de los CLI nativos modernos de Node.js siguen utilizándolo o dependiendo fuertemente de él. Esto se debe a que provee exposición directa al *Apple Keychain* (macOS), *Credential Manager* (Windows) y *libsecret* (Linux).
- **El Valor Ganado:** Al vincularnos a la seguridad a nivel hardware y de sesión del SO del usuario, prevenimos vulnerabilidades catastróficas. Ninguno de los scripts sospechosos o usuarios ajenos en la misma computadora podrán extraer este JSON de la carpeta `.lazy`, dado que el SO requiere que se provea el contexto correcto (autorización) para descifrar la llave del bóveda nativa.

### 2. Login de Interfaz Temporal Lógica (Loopback - *127.0.0.1*)
En el comando `lazy login`, levantamos un portal temporal interceptor en un puerto para recibir el callback luego de abrir el navegador web.
- **Razón del cambio:** Aseguramos el servidor local indicándole explícitamente (`listen(PORT, '127.0.0.1')`) que escuche en la red de "bucle" (`localhost`). Anteriormente escuchaba indiscriminadamente, arriesgándose a ataques (e.g., inyección de tokens) desde otra computadora en una red WiFi de oficina.
- **Estándar en Ciberseguridad (RFC 8252):** Esta implementación refleja exactamente las directivas del **OAuth 2.0 for Native Apps (RFC 8252 - *Loopback Interface Redirection*)**. En la industria, herramientas de gran adopción como `gcloud`, `aws-cli` o `vercel` usan este mismo mecanismo de levantar un servidor local (`127.0.0.1`), recibir las credenciales y cerrarlo. Resulta en una experiencia fluida (no requiere copiar/pegar un hash enorme en la pantalla) de forma 100% segura frente a ataques externos locales.
