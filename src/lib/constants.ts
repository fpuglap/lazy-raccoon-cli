import { homedir } from "os";
import { join } from "path";

export const LAZY_DIR = process.env.LAZY_RACCOON_DIR || join(homedir(), ".lazy-raccoon");
export const CREDENTIALS_FILE = join(LAZY_DIR, "credentials.json");

// Default API URL — overridden by credentials.json or env var
export const DEFAULT_API_URL = process.env.LAZY_RACCOON_API_URL || "https://lazyraccoon.dev";

export const DEFAULT_TOOL = "claude";

export const AUTH_CALLBACK_PORT = 9876;
export const AUTH_TIMEOUT_MS = 120_000;

export function getConfigName(profile?: string): string {
  return profile || "default";
}
