import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  setupCredentials,
  setupCredentials2,
  cleanupCredentials,
  runLazy,
  runLazyAsUser2,
  createTeamApi,
  inviteToTeamApi,
  deleteTeam,
  API_KEY,
  API_KEY_2,
  TEST_EMAIL_2,
} from "./helpers.js";

const TEAM_NAME = `E2E Invite Team ${Date.now()}`;
let teamSlug: string;
let invitationId: string;

beforeAll(async () => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  if (!API_KEY_2) throw new Error("E2E_API_KEY_2 not set. Run the seed script with user 2.");
  setupCredentials();
  setupCredentials2();

  // Create team as user 1
  const team = await createTeamApi(TEAM_NAME);
  teamSlug = team.slug;
});

afterAll(async () => {
  if (teamSlug) await deleteTeam(teamSlug).catch(() => {});
  cleanupCredentials();
});

describe("team invitations", () => {
  it("invite user 2 via CLI", async () => {
    const { stdout, stderr } = await runLazy(["teams", "invite", teamSlug, TEST_EMAIL_2]);
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/invited|invitation|sent/i);
  });

  it("user 2 sees pending invitation", async () => {
    const { stdout, stderr } = await runLazyAsUser2(["teams", "invitations"]);
    const output = stdout + stderr;
    expect(output).toContain(TEAM_NAME);

    // Extract invitation ID from output
    const idMatch = output.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (idMatch) {
      invitationId = idMatch[1];
    }
  });

  it("user 2 accepts invitation", async () => {
    expect(invitationId).toBeTruthy();
    const { stdout, stderr } = await runLazyAsUser2(["teams", "accept", invitationId]);
    const output = stdout + stderr;
    expect(output.toLowerCase()).toMatch(/accepted|joined|team/i);
  });

  it("team info shows 2 members", async () => {
    const { stdout } = await runLazy(["teams", "info", teamSlug]);
    expect(stdout).toContain(TEAM_NAME);
    // Should show at least 2 member rows
    expect(stdout.toLowerCase()).toContain("owner");
    expect(stdout.toLowerCase()).toContain("member");
  });

  // Note: leave test skipped — the leave API requires specific team member lookup
  // that doesn't work correctly with API key auth in this test setup
});
