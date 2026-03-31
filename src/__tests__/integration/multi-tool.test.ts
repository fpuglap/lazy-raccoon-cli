import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import {
  setupCredentials,
  cleanupCredentials,
  createTempDir,
  removeTempDir,
  deleteConfig,
  listConfigsApi,
  API_KEY,
  API_URL,
} from "./helpers.js";
import { spawn } from "child_process";
import { resolve } from "path";

const CLI_PATH = resolve(import.meta.dirname, "../../../dist/bin/lazy.js");

let pushDir: string;
let pullDir: string;
let credsDir: string;

function runLazy(
  args: string[],
  options?: { input?: string; env?: Record<string, string> }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [CLI_PATH, ...args], {
      env: {
        ...process.env,
        LAZY_RACCOON_DIR: credsDir,
        LAZY_RACCOON_API_URL: API_URL,
        ...(options?.env || {}),
      },
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

beforeAll(() => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  credsDir = setupCredentials();
  pushDir = createTempDir("lazy-e2e-cursor-");
  pullDir = createTempDir("lazy-e2e-cursor-pull-");

  // Create cursor config files: rules/test.mdc
  mkdirSync(join(pushDir, "rules"), { recursive: true });
  writeFileSync(join(pushDir, "rules", "test.mdc"), "---\ntitle: E2E Test Rule\n---\nThis is a test rule.");
});

afterAll(async () => {
  // Clean up cursor configs
  try {
    const configs = await listConfigsApi();
    for (const c of configs) {
      if (c.tool === "cursor") {
        await deleteConfig(c.id).catch(() => {});
      }
    }
  } catch {}
  if (pushDir) removeTempDir(pushDir);
  if (pullDir) removeTempDir(pullDir);
  cleanupCredentials();
});

describe("multi-tool (cursor)", () => {
  it("push cursor config via API and pull to temp dir", async () => {
    // Push via API
    const res = await fetch(`${API_URL}/api/configs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "default",
        tool: "cursor",
        data: { rules: { "test.mdc": "---\ntitle: E2E\n---\nTest rule" } },
      }),
    });
    expect(res.ok).toBe(true);

    // Pull to temp dir
    const { stdout, stderr } = await runLazy(
      ["pull", "--force", "--tool", "cursor", "--dir", pullDir],
      { input: "y\n" }
    );
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/pull|applied|success|written|config/i);

    // Verify file was written
    const rulePath = join(pullDir, "rules", "test.mdc");
    expect(existsSync(rulePath)).toBe(true);
  });

  it("cursor config appears in API list", async () => {
    const configs = await listConfigsApi();
    const cursorConfig = configs.find((c) => c.tool === "cursor");
    expect(cursorConfig).toBeTruthy();
  });
});
