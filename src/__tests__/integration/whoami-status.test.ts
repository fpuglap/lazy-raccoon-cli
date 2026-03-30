import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupCredentials, cleanupCredentials, runLazy, TEST_EMAIL, API_KEY } from "./helpers.js";

beforeAll(() => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  setupCredentials();
});

afterAll(() => {
  cleanupCredentials();
});

describe("whoami", () => {
  it("shows the test user email", async () => {
    const { stdout } = await runLazy(["whoami"]);
    expect(stdout).toContain(TEST_EMAIL);
  });
});

describe("status", () => {
  it("runs without error", async () => {
    // Status may show configs or "no configs" — both are valid
    const { stdout } = await runLazy(["status"]);
    expect(stdout).toBeTruthy();
  });
});
