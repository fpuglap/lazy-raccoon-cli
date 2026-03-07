import { homedir } from "os";
import { join } from "path";

export const LAZY_DIR = join(homedir(), ".lazy-raccoon");
export const CREDENTIALS_FILE = join(LAZY_DIR, "credentials.json");
export const CLAUDE_DIR = join(homedir(), ".claude");

// Default API URL — overridden by credentials.json
export const DEFAULT_API_URL = "http://localhost:3000";
