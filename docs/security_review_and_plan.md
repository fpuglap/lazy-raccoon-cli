# Security Review and Improvements Plan

This document details the security points and areas for improvement discovered in the project, the plan to address them, and the progress status.

## Summary of Detected Issues

1. **Connection Retries**: Lack of resilience in the API to overcome temporary outages.
2. **Zod Validation in the API**: Lack of strict checking of received JSON data structures.
3. **Loss of File Metadata**: `lazy pull` replaces files and loses their original permissions (`chmod +x`).
4. **Automatic Backup Cleanup**: Multiple folder backups accumulate on disk without a cleanup mechanism.
5. **Insecure Credential Storage**: The JWT token is saved in plain text (`credentials.json`).
6. **Insecure Local Login Flow**: Lack of strict restriction and validation on the CLI's temporary server to receive the Token.

## Execution Plan and Branches

The work will be sub-divided into branches created from the current branch (`review`):

### 1. `feature/api-resilience`
- [x] Implement retries (retry mechanism) in API calls (`api.ts`).
- [x] Incorporate strict validations like `zod` for JSON responses.
- [x] Write automated tests `api.test.ts`.

### 2. `feature/file-operations`
- [x] Implement file mode/permissions preservation when overwriting `config-writer.ts`.
- [x] Develop a cleanup system keeping a maximum of 5 old copies on disk.
- [x] Write tests in `config-writer.test.ts`.

### 3. `feature/secure-auth`
- [x] Use `@node-rs/keyring` or `keytar` (cross-platform) for the token in `credentials.ts`.
- [x] Restrict `login.ts` to mitigate local vulnerabilities (limit at localhost interface).
- [x] Implement a fallback mechanism if there is a pending migration.
- [x] Write corresponding tests.

## Progress
- **Base Documentation**: ✔ Completed. In the `review` branch.
- **API Resilience**: ✔ Completed. In the `feature/api-resilience` branch.
- **File Operations**: ✔ Completed. In the `feature/file-operations` branch.
- **Secure Auth**: ✔ Completed. In the `feature/secure-auth` branch.

## Architecture Decisions and Industry Standards

During implementation, changes were introduced to align the CLI with top cybersecurity best practices, in particular:

### 1. Use of `keytar` for Secure Storage
Previously, tokens (JWT) were saved in plain text in a `.json` file on disk. Currently, we are using `keytar` as an adapter for the **native Keychain**.
- **Why `keytar`:** Despite recently being labeled as deprecated on GitHub, the majority of modern native Node.js CLIs still use it or rely heavily on it. This is because it provides direct exposure to the *Apple Keychain* (macOS), *Credential Manager* (Windows) and *libsecret* (Linux).
- **The Earned Value:** By linking into the hardware and session-level security of the user's OS, we prevent catastrophic vulnerabilities. No suspicious scripts or unauthorized users on the same computer will be able to extract this JSON from the `.lazy` folder, given that the OS requires the correct context (authorization) to decrypt the key of the native vault.

### 2. Temporary Logical Interface Login (Loopback - *127.0.0.1*)
In the `lazy login` command, we spin up a temporary interceptor portal on a port to receive the callback after opening the web browser.
- **Reason for the change:** We secure the local server by explicitly instructing it (`listen(PORT, '127.0.0.1')`) to listen on the loopback network (`localhost`). Previously it listened indiscriminately, risking attacks (e.g., token injection) from another computer on an office WiFi network.
- **Cybersecurity Standard (RFC 8252):** This implementation accurately reflects the directives of **OAuth 2.0 for Native Apps (RFC 8252 - *Loopback Interface Redirection*)**. In the industry, highly adopted tools like `gcloud`, `aws-cli` or `vercel` use this exact mechanism of spinning up a local server (`127.0.0.1`), receiving the credentials, and closing it. It results in a smooth experience (does not require copy/pasting a huge hash on the screen) in a way that is 100% secure against local external attacks.
