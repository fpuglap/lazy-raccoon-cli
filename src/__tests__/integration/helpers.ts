import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resolve } from "path";

const execFileAsync = promisify(execFile);

// Resolve paths
const CLI_PATH = resolve(import.meta.dirname, "../../../dist/bin/lazy.js");

// Test constants
export const API_URL = process.env.E2E_API_URL || "http://localhost:3000";
export const API_KEY = process.env.E2E_API_KEY || "";
export const TEST_EMAIL = process.env.E2E_USER_EMAIL || "e2e+clerk_test@lazyraccoon.dev";

// Temp directory for isolated credentials
let credentialsDir: string;

export function setupCredentials(): string {
  credentialsDir = mkdtempSync(join(tmpdir(), "lazy-e2e-creds-"));
  const creds = {
    token: API_KEY,
    email: TEST_EMAIL,
    api_url: API_URL,
  };
  writeFileSync(join(credentialsDir, "credentials.json"), JSON.stringify(creds, null, 2), { mode: 0o600 });
  return credentialsDir;
}

export function cleanupCredentials(): void {
  if (credentialsDir) {
    rmSync(credentialsDir, { recursive: true, force: true });
  }
}

export function createTempDir(prefix = "lazy-e2e-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function removeTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/**
 * Run a lazy CLI command as a subprocess with isolated credentials.
 */
export async function runLazy(
  args: string[],
  options?: { input?: string; cwd?: string; env?: Record<string, string> }
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("node", [CLI_PATH, ...args], {
    env: {
      ...process.env,
      LAZY_RACCOON_DIR: credentialsDir,
      LAZY_RACCOON_API_URL: API_URL,
      ...(options?.env || {}),
    },
    cwd: options?.cwd,
    timeout: 15_000,
  });
}

/**
 * Create a temp directory with a fake Claude config for push testing.
 */
export function createFakeClaudeConfig(configName = "e2e-test"): string {
  const dir = createTempDir("lazy-e2e-claude-");
  writeFileSync(join(dir, "CLAUDE.md"), `# E2E Test Config\nThis is a test config created by E2E tests.\nConfig: ${configName}\nTimestamp: ${Date.now()}`);
  return dir;
}

/**
 * Delete a config via the API (cleanup).
 */
export async function deleteConfig(configId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/configs/${configId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete config ${configId}: ${res.status}`);
  }
}

/**
 * Delete a team via the API (cleanup).
 */
export async function deleteTeam(slug: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/teams/${slug}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete team ${slug}: ${res.status}`);
  }
}

/**
 * List configs via the API.
 */
export async function listConfigsApi(): Promise<Array<{ id: string; name: string; tool: string; version: number }>> {
  const res = await fetch(`${API_URL}/api/configs`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to list configs: ${res.status}`);
  return res.json();
}

/**
 * Push a config via the API.
 */
export async function pushConfigApi(
  name: string,
  tool: string,
  data: Record<string, unknown>
): Promise<{ id: string; version: number }> {
  const res = await fetch(`${API_URL}/api/configs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, tool, data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Failed to push config: ${res.status} ${JSON.stringify(body)}`);
  }
  return res.json();
}
