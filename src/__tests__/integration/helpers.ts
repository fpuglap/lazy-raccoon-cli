import { spawn } from "child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

// Resolve paths
const CLI_PATH = resolve(import.meta.dirname, "../../../dist/bin/lazy.js");

// Test constants — User 1
export const API_URL = process.env.E2E_API_URL || "http://localhost:3000";
export const API_KEY = process.env.E2E_API_KEY || "";
export const TEST_EMAIL = process.env.E2E_USER_EMAIL || "e2e+clerk_test@lazyraccoon.dev";

// Test constants — User 2
export const API_KEY_2 = process.env.E2E_API_KEY_2 || "";
export const TEST_EMAIL_2 = process.env.E2E_USER_EMAIL_2 || "e2e-user2+clerk_test@lazyraccoon.dev";

// Temp directories for isolated credentials
let credentialsDir: string;
let credentialsDir2: string;

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

export function setupCredentials2(): string {
  credentialsDir2 = mkdtempSync(join(tmpdir(), "lazy-e2e-creds2-"));
  const creds = {
    token: API_KEY_2,
    email: TEST_EMAIL_2,
    api_url: API_URL,
  };
  writeFileSync(join(credentialsDir2, "credentials.json"), JSON.stringify(creds, null, 2), { mode: 0o600 });
  return credentialsDir2;
}

export function cleanupCredentials(): void {
  if (credentialsDir) {
    rmSync(credentialsDir, { recursive: true, force: true });
  }
  if (credentialsDir2) {
    rmSync(credentialsDir2, { recursive: true, force: true });
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
export function runLazy(
  args: string[],
  options?: { input?: string; cwd?: string; env?: Record<string, string> }
): Promise<{ stdout: string; stderr: string }> {
  return spawnLazy(args, credentialsDir, options);
}

/**
 * Run a lazy CLI command as user 2.
 */
export function runLazyAsUser2(
  args: string[],
  options?: { input?: string; cwd?: string; env?: Record<string, string> }
): Promise<{ stdout: string; stderr: string }> {
  return spawnLazy(args, credentialsDir2, options);
}

function spawnLazy(
  args: string[],
  credsDir: string,
  options?: { input?: string; cwd?: string; env?: Record<string, string> }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [CLI_PATH, ...args], {
      env: {
        ...process.env,
        LAZY_RACCOON_DIR: credsDir,
        LAZY_RACCOON_API_URL: API_URL,
        ...(options?.env || {}),
      },
      cwd: options?.cwd,
      timeout: 15_000,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d));
    child.stderr.on("data", (d: Buffer) => (stderr += d));

    if (options?.input) {
      child.stdin.write(options.input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Exit code ${code}\nstdout: ${stdout}\nstderr: ${stderr}`));
    });
    child.on("error", reject);
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

/**
 * Get config versions via API.
 */
export async function getConfigVersions(
  configId: string
): Promise<Array<{ id: string; version: number; isCurrent: boolean }>> {
  const res = await fetch(`${API_URL}/api/configs/${configId}/versions`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to get versions: ${res.status}`);
  return res.json();
}

/**
 * Rollback a config to a specific version via API.
 */
export async function rollbackConfig(configId: string, versionId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/configs/${configId}/rollback`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ versionId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Failed to rollback: ${res.status} ${JSON.stringify(body)}`);
  }
}

/**
 * Create a team via API.
 */
export async function createTeamApi(name: string): Promise<{ id: string; slug: string }> {
  const res = await fetch(`${API_URL}/api/teams`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Failed to create team: ${res.status} ${JSON.stringify(body)}`);
  }
  return res.json();
}

/**
 * Invite a user to a team via API.
 */
export async function inviteToTeamApi(slug: string, email: string): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/teams/${slug}/invitations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, role: "member" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Failed to invite: ${res.status} ${JSON.stringify(body)}`);
  }
  return res.json();
}

/**
 * Accept an invitation via API (as user 2).
 */
export async function acceptInvitationApi(invitationId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/invitations/${invitationId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY_2}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Failed to accept invitation: ${res.status} ${JSON.stringify(body)}`);
  }
}

/**
 * Pull config via API (for verification).
 */
export async function pullConfigApi(
  name: string,
  tool: string,
  teamId?: string
): Promise<{ data: unknown; version: number }> {
  let path = `/api/configs/latest?name=${name}&tool=${tool}`;
  if (teamId) path += `&teamId=${teamId}`;
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to pull config: ${res.status}`);
  return res.json();
}
