import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { API_URL } from "./helpers.js";

const CLI_PATH = resolve(import.meta.dirname, "../../../dist/bin/lazy.js");

let fakeCredsDir: string;

function runWithCreds(args: string[], credsDir: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn("node", [CLI_PATH, ...args], {
      env: {
        ...process.env,
        LAZY_RACCOON_DIR: credsDir,
        LAZY_RACCOON_API_URL: API_URL,
      },
      timeout: 15_000,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d));
    child.stderr.on("data", (d: Buffer) => (stderr += d));
    child.stdin.end();

    child.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
    child.on("error", () => resolve({ stdout, stderr, code: 1 }));
  });
}

beforeAll(() => {
  fakeCredsDir = mkdtempSync(join(tmpdir(), "lazy-e2e-errs-"));
});

afterAll(() => {
  if (fakeCredsDir) rmSync(fakeCredsDir, { recursive: true, force: true });
});

describe("error handling", () => {
  it("invalid token returns auth error", async () => {
    // Write credentials with fake token
    writeFileSync(
      join(fakeCredsDir, "credentials.json"),
      JSON.stringify({ token: "lr_fake_invalid_token", email: "test@test.com", api_url: API_URL }),
      { mode: 0o600 }
    );

    const { code, stderr } = await runWithCreds(["whoami"], fakeCredsDir);
    expect(code).not.toBe(0);
    expect(stderr.toLowerCase()).toMatch(/expired|login|error/i);
  });

  it("pull non-existent profile fails", async () => {
    // Write valid credentials
    const validCredsDir = mkdtempSync(join(tmpdir(), "lazy-e2e-errs2-"));
    writeFileSync(
      join(validCredsDir, "credentials.json"),
      JSON.stringify({
        token: process.env.E2E_API_KEY,
        email: "test@test.com",
        api_url: API_URL,
      }),
      { mode: 0o600 }
    );

    const { code, stderr } = await runWithCreds(
      ["pull", "--force", "--tool", "claude", "--profile", "nonexistent-e2e-profile"],
      validCredsDir
    );
    expect(code).not.toBe(0);
    expect(stderr.toLowerCase()).toMatch(/not found|no config|error/i);

    rmSync(validCredsDir, { recursive: true, force: true });
  });

  it("invalid tool name fails", async () => {
    const validCredsDir = mkdtempSync(join(tmpdir(), "lazy-e2e-errs3-"));
    writeFileSync(
      join(validCredsDir, "credentials.json"),
      JSON.stringify({
        token: process.env.E2E_API_KEY,
        email: "test@test.com",
        api_url: API_URL,
      }),
      { mode: 0o600 }
    );

    const { code, stderr } = await runWithCreds(
      ["push", "--tool", "faketool"],
      validCredsDir
    );
    expect(code).not.toBe(0);
    expect(stderr.toLowerCase()).toMatch(/unknown|invalid|error/i);

    rmSync(validCredsDir, { recursive: true, force: true });
  });
});
