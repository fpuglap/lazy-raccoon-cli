import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupCredentials, cleanupCredentials, runLazy, API_KEY } from "./helpers.js";
import { existsSync } from "fs";
import { join } from "path";

let credsDir: string;

beforeAll(() => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  credsDir = setupCredentials();
});

afterAll(() => {
  cleanupCredentials();
});

describe("logout", () => {
  it("whoami works before logout", async () => {
    const { stdout } = await runLazy(["whoami"]);
    expect(stdout).toBeTruthy();
  });

  it("logout removes credentials", async () => {
    const { stdout, stderr } = await runLazy(["logout"]);
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/logged out|removed|success/i);
    expect(existsSync(join(credsDir, "credentials.json"))).toBe(false);
  });

  it("whoami fails after logout", async () => {
    await expect(runLazy(["whoami"])).rejects.toThrow();
  });
});
