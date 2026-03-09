import { homedir } from "os";
import { join } from "path";

export const LAZY_DIR = join(homedir(), ".lazy-raccoon");
export const CREDENTIALS_FILE = join(LAZY_DIR, "credentials.json");

// Default API URL — overridden by credentials.json
export const DEFAULT_API_URL = "https://lazy-raccoon-web.vercel.app";

export const DEFAULT_TOOL = "claude";

export function getConfigName(profile?: string): string {
  return profile || "default";
}
