import { describe, it, expect } from "vitest";
import { generateChangeSummary, diffConfigs } from "../lib/diff.js";
import { claude } from "../lib/tools/claude.js";

describe("generateChangeSummary", () => {
  it("returns 'No changes' when nothing changed", () => {
    const config = { claude_md: "content" };
    const diff = diffConfigs(claude, config, config);
    expect(generateChangeSummary(claude, diff)).toBe("No changes");
  });

  it("reports added files", () => {
    const base = {};
    const target = { claude_md: "content", settings: { model: "opus" } };
    const diff = diffConfigs(claude, base, target);
    const summary = generateChangeSummary(claude, diff);
    expect(summary).toContain("Added");
    expect(summary).toContain("CLAUDE.md");
  });

  it("reports modified files", () => {
    const base = { claude_md: "old" };
    const target = { claude_md: "new" };
    const diff = diffConfigs(claude, base, target);
    const summary = generateChangeSummary(claude, diff);
    expect(summary).toContain("Modified");
    expect(summary).toContain("CLAUDE.md");
  });

  it("reports removed files", () => {
    const base = { claude_md: "content" };
    const target = {};
    const diff = diffConfigs(claude, base, target);
    const summary = generateChangeSummary(claude, diff);
    expect(summary).toContain("Removed");
    expect(summary).toContain("CLAUDE.md");
  });

  it("reports added dir files with path", () => {
    const base = { commands: { "review.md": "content" } };
    const target = { commands: { "review.md": "content", "deploy.md": "new" } };
    const diff = diffConfigs(claude, base, target);
    const summary = generateChangeSummary(claude, diff);
    expect(summary).toContain("Added");
    expect(summary).toContain("commands/");
  });

  it("truncates when many changes", () => {
    const base = {};
    const target = {
      claude_md: "a",
      settings: { model: "opus" },
      mcp_servers: { github: {} },
      commands: { "a.md": "a", "b.md": "b", "c.md": "c", "d.md": "d" },
    };
    const diff = diffConfigs(claude, base, target);
    const summary = generateChangeSummary(claude, diff);
    expect(summary).toContain("files");
  });
});
