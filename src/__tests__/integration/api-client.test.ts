import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { pushConfig, pullConfig, listConfigs, getMe } from "../../lib/api.js";
import type { Credentials } from "../../types/index.js";
import { API_URL, API_KEY, TEST_EMAIL, deleteConfig } from "./helpers.js";

const CONFIG_NAME = `e2e-api-${Date.now()}`;
const createdConfigIds: string[] = [];

let creds: Credentials;

beforeAll(() => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  creds = { token: API_KEY, email: TEST_EMAIL, api_url: API_URL };
});

afterAll(async () => {
  for (const id of createdConfigIds) {
    await deleteConfig(id).catch(() => {});
  }
});

describe("API client", () => {
  it("getMe returns the test user email", async () => {
    const me = await getMe(creds);
    expect(me.email).toBe(TEST_EMAIL);
  });

  it("pushConfig creates a new config", async () => {
    const data = { claude_md: "# E2E API test" };
    const result = await pushConfig(creds, CONFIG_NAME, "claude", data);
    expect(result.id).toBeTruthy();
    expect(result.version).toBe(1);
    createdConfigIds.push(result.id);
  });

  it("pushConfig with same data returns noChange", async () => {
    const data = { claude_md: "# E2E API test" };
    const result = await pushConfig(creds, CONFIG_NAME, "claude", data);
    expect((result as Record<string, unknown>).noChange).toBe(true);
  });

  it("pushConfig with updated data increments version", async () => {
    const data = { claude_md: "# E2E API test v2" };
    const result = await pushConfig(creds, CONFIG_NAME, "claude", data);
    expect(result.version).toBe(2);
  });

  it("pullConfig returns the latest data", async () => {
    const result = await pullConfig(creds, CONFIG_NAME, "claude");
    expect(result.data).toBeTruthy();
    expect(result.version).toBe(2);
  });

  it("listConfigs includes the created config", async () => {
    const configs = await listConfigs(creds);
    const found = configs.find((c) => c.name === CONFIG_NAME);
    expect(found).toBeTruthy();
    expect(found!.tool).toBe("claude");
  });
});
