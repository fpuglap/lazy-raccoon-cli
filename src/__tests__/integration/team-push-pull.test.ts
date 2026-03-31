import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  setupCredentials,
  cleanupCredentials,
  createTempDir,
  removeTempDir,
  deleteTeam,
  createTeamApi,
  runLazy,
  API_KEY,
  API_URL,
} from "./helpers.js";

const TEAM_NAME = `E2E Team Push ${Date.now()}`;
let teamSlug: string;
let teamId: string;
let pushDir: string;
let pullDir: string;

beforeAll(async () => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  setupCredentials();
  pushDir = createTempDir("lazy-e2e-team-push-");
  pullDir = createTempDir("lazy-e2e-team-pull-");

  // Create team via API
  const team = await createTeamApi(TEAM_NAME);
  teamSlug = team.slug;
  teamId = team.id;

  // Create fake CLAUDE.md
  writeFileSync(join(pushDir, "CLAUDE.md"), `# Team Push Test\nTimestamp: ${Date.now()}`);
});

afterAll(async () => {
  if (teamSlug) await deleteTeam(teamSlug).catch(() => {});
  if (pushDir) removeTempDir(pushDir);
  if (pullDir) removeTempDir(pullDir);
  cleanupCredentials();
});

describe("push and pull with --team", () => {
  it("push to team", async () => {
    const { stdout, stderr } = await runLazy(
      ["push", "--force", "--tool", "claude", "--team", teamSlug],
      { env: { CLAUDE_DIR: pushDir }, input: "y\n" }
    );
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/push|v1|success|uploaded|config/i);
  });

  it("pull from team to temp dir", async () => {
    const { stdout, stderr } = await runLazy(
      ["pull", "--force", "--tool", "claude", "--team", teamSlug, "--dir", pullDir],
      { input: "y\n" }
    );
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/pull|applied|success|written|config/i);

    const claudeMd = join(pullDir, "CLAUDE.md");
    expect(existsSync(claudeMd)).toBe(true);
    const content = readFileSync(claudeMd, "utf-8");
    expect(content).toContain("Team Push Test");
  });
});
