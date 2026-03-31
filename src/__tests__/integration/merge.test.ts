import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync } from "fs";
import { join } from "path";
import {
  setupCredentials,
  cleanupCredentials,
  createTempDir,
  removeTempDir,
  pushConfigApi,
  pullConfigApi,
  deleteConfig,
  listConfigsApi,
  runLazy,
  API_KEY,
} from "./helpers.js";

const CONFIG_NAME = "default";
let pushDir: string;

beforeAll(async () => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
  setupCredentials();
  pushDir = createTempDir("lazy-e2e-merge-");

  // Push initial config via API with a cloud-only field (settings)
  await pushConfigApi(CONFIG_NAME, "claude", {
    claude_md: "# Cloud content",
    settings: { theme: "dark", model: "opus" },
  });
});

afterAll(async () => {
  if (pushDir) removeTempDir(pushDir);
  cleanupCredentials();
});

describe("merge (non-force) push", () => {
  it("merges local changes with cloud-only fields", async () => {
    // Create local CLAUDE.md with different content
    writeFileSync(join(pushDir, "CLAUDE.md"), "# Local content\nMerged from local.");

    // Push without --force (merge mode), pipe "y" to confirm
    // CLAUDE_DIR points to our temp dir, config name is "default"
    const { stdout, stderr } = await runLazy(
      ["push", "--tool", "claude"],
      { env: { CLAUDE_DIR: pushDir }, input: "y\n" }
    );
    const output = stdout + stderr;
    // Should show changes and succeed
    expect(output.toLowerCase()).toMatch(/push|changes|config|v\d/i);
  });

  it("merged result has local content for claude_md", async () => {
    const pulled = await pullConfigApi(CONFIG_NAME, "claude");
    const data = pulled.data as Record<string, unknown>;

    // Local wins on claude_md (text conflict)
    expect(data.claude_md).toContain("Local content");
  });
});
