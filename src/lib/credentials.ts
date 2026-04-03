import { existsSync, readFileSync, mkdirSync, unlinkSync } from "fs";
import keytar from "keytar";
import { LAZY_DIR, CREDENTIALS_FILE } from "./constants.js";
import type { Credentials } from "../types/index.js";

const SERVICE_NAME = "lazy-raccoon";
const ACCOUNT_NAME = "cli-config";

export async function getCredentials(): Promise<Credentials | null> {
  // First check secure storage
  try {
    const secureData = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (secureData) {
      return JSON.parse(secureData) as Credentials;
    }
  } catch {
    // Ignore keytar errors on read
  }

  // Fallback to legacy file (migration path)
  if (!existsSync(CREDENTIALS_FILE)) return null;

  try {
    const raw = readFileSync(CREDENTIALS_FILE, "utf-8");
    const creds = JSON.parse(raw) as Credentials;
    
    // Attempt to migrate to secure storage and delete plaintext
    await saveCredentials(creds);
    unlinkSync(CREDENTIALS_FILE);
    
    return creds;
  } catch {
    return null;
  }
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
  mkdirSync(LAZY_DIR, { recursive: true });
  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(credentials));
  
  // Cleanup plaintext if it exists
  if (existsSync(CREDENTIALS_FILE)) {
    unlinkSync(CREDENTIALS_FILE);
  }
}

export async function deleteCredentials(): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  if (existsSync(CREDENTIALS_FILE)) {
    unlinkSync(CREDENTIALS_FILE);
  }
}

export async function requireAuth(): Promise<Credentials> {
  const creds = await getCredentials();
  if (!creds) {
    console.error("Error: Not logged in. Run `lazy login` first.");
    process.exit(1);
  }
  return creds;
}
