import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { LAZY_DIR, CREDENTIALS_FILE } from "./constants.js";
import type { Credentials } from "../types/index.js";

export function getCredentials(): Credentials | null {
  if (!existsSync(CREDENTIALS_FILE)) return null;

  try {
    const raw = readFileSync(CREDENTIALS_FILE, "utf-8");
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: Credentials): void {
  mkdirSync(LAZY_DIR, { recursive: true });
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), { mode: 0o600 });
}

export function deleteCredentials(): void {
  if (existsSync(CREDENTIALS_FILE)) {
    unlinkSync(CREDENTIALS_FILE);
  }
}

export function requireAuth(): Credentials {
  const creds = getCredentials();
  if (!creds) {
    console.error("Error: Not logged in. Run `lazy login` first.");
    process.exit(1);
  }
  return creds;
}
