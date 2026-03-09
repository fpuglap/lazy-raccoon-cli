import { homedir } from "os";
import { join } from "path";

export const LAZY_DIR = join(homedir(), ".lazy-raccoon");
export const CREDENTIALS_FILE = join(LAZY_DIR, "credentials.json");

// Default API URL — overridden by credentials.json
export const DEFAULT_API_URL = "http://localhost:3000";

export function getClaudeDir(profile?: string): string {
  if (process.env.CLAUDE_DIR) return process.env.CLAUDE_DIR;
  if (profile && profile !== "default") {
    return join(homedir(), `.claude-${profile}`);
  }
  return join(homedir(), ".claude");
}

export function getConfigName(profile?: string): string {
  return profile || "default";
}

// Keep for backwards compat with config-reader/writer imports
export const CLAUDE_DIR = getClaudeDir();
