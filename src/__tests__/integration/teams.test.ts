import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  setupCredentials,
  cleanupCredentials,
  deleteTeam,
  API_KEY,
  API_URL,
} from "./helpers.js";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolve } from "path";

const execFileAsync = promisify(execFile);
const CLI_PATH = resolve(import.meta.dirname, "../../../dist/bin/lazy.js");

const TEAM_NAME = `E2E Test Team ${Date.now()}`;
let teamSlug: string;
let credsDir: string;

async function runLazy(args: string[]) {
  return execFileAsync("node", [CLI_PATH, ...args], {
    env: {
      ...process.env,
      LAZY_RACCOON_DIR: credsDir,
      LAZY_RACCOON_API_URL: API_URL,
    },
    timeout: 15_000,
  });
}

beforeAll(() => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  credsDir = setupCredentials();
});

afterAll(async () => {
  if (teamSlug) {
    await deleteTeam(teamSlug).catch(() => {});
  }
  cleanupCredentials();
});

describe("teams", () => {
  it("creates a team", async () => {
    const { stdout, stderr } = await runLazy(["teams", "create", TEAM_NAME]);
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/created|team/i);

    // Extract slug from output (format: /slug or (/<slug>))
    const slugMatch = output.match(/\/([a-z0-9-]+)/);
    if (slugMatch) {
      teamSlug = slugMatch[1];
    } else {
      // Fallback: generate slug from name
      teamSlug = TEAM_NAME.toLowerCase().replace(/\s+/g, "-");
    }
  });

  it("lists teams including the created one", async () => {
    const { stdout } = await runLazy(["teams"]);
    expect(stdout).toContain(TEAM_NAME);
  });

  it("shows team info", async () => {
    expect(teamSlug).toBeTruthy();
    const { stdout } = await runLazy(["teams", "info", teamSlug]);
    expect(stdout).toContain(TEAM_NAME);
  });
});
