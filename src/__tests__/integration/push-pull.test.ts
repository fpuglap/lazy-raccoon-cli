import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, readFileSync, existsSync } from "fs";
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
const configIds: string[] = [];

function runLazy(args: string[], options?: { env?: Record<string, string>; input?: string }): Promise<{ stdout: string; stderr: string }> {
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
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    // Auto-confirm prompts
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
  pushDir = createTempDir("lazy-e2e-push-");
  pullDir = createTempDir("lazy-e2e-pull-");

  // Create a fake CLAUDE.md in the push directory
  writeFileSync(
    join(pushDir, "CLAUDE.md"),
    `# E2E Push Test\nTimestamp: ${Date.now()}`
  );
});

afterAll(async () => {
  // Clean up e2e configs
  try {
    const configs = await listConfigsApi();
    for (const c of configs) {
      if (c.name === "default") {
        // Only delete if it's our test config (check by looking at the version)
      }
    }
  } catch {}
  for (const id of configIds) {
    await deleteConfig(id).catch(() => {});
  }
  if (pushDir) removeTempDir(pushDir);
  if (pullDir) removeTempDir(pullDir);
  cleanupCredentials();
});

describe("push and pull", () => {
  it("push uploads a config", async () => {
    // Use CLAUDE_DIR to point push at our temp dir, pipe "y" for confirmation
    const { stdout, stderr } = await runLazy(
      ["push", "--force", "--tool", "claude"],
      { env: { CLAUDE_DIR: pushDir }, input: "y\n" }
    );
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/push|v\d|success|uploaded|config/i);
  });

  it("status shows configs", async () => {
    const { stdout } = await runLazy(["status"]);
    // Should show at least one config (the one we just pushed as "default")
    expect(stdout).toContain("default");
  });

  it("pull downloads the config to a temp directory", async () => {
    const { stdout, stderr } = await runLazy(
      ["pull", "--force", "--tool", "claude", "--dir", pullDir],
      { input: "y\n" }
    );
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/pull|applied|success|written|config/i);

    // Verify the file was written
    const claudeMd = join(pullDir, "CLAUDE.md");
    expect(existsSync(claudeMd)).toBe(true);
    const content = readFileSync(claudeMd, "utf-8");
    expect(content).toContain("E2E Push Test");
  });
});
