import { describe, it, expect } from "vitest";
import { diffConfigs } from "../lib/diff.js";
import { claude } from "../lib/tools/claude.js";

describe("diffConfigs", () => {
  it("detects no changes", () => {
    const config = { claude_md: "content", settings: { model: "opus" } };
    const result = diffConfigs(claude, config, config);
    expect(result.hasChanges).toBe(false);
  });

  it("detects added text field", () => {
    const base = {};
    const target = { claude_md: "new content" };
    const result = diffConfigs(claude, base, target);
    expect(result.hasChanges).toBe(true);
    const field = result.fields.find((f) => f.field === "claude_md");
    expect(field?.change).toBe("added");
  });

  it("detects removed text field", () => {
    const base = { claude_md: "content" };
    const target = {};
    const result = diffConfigs(claude, base, target);
    expect(result.hasChanges).toBe(true);
    const field = result.fields.find((f) => f.field === "claude_md");
    expect(field?.change).toBe("removed");
  });

  it("detects modified text field", () => {
    const base = { claude_md: "old" };
    const target = { claude_md: "new" };
    const result = diffConfigs(claude, base, target);
    expect(result.hasChanges).toBe(true);
    const field = result.fields.find((f) => f.field === "claude_md");
    expect(field?.change).toBe("modified");
  });

  it("detects added json keys", () => {
    const base = { settings: { model: "opus" } };
    const target = { settings: { model: "opus", theme: "dark" } };
    const result = diffConfigs(claude, base, target);
    const field = result.fields.find((f) => f.field === "settings");
    expect(field?.change).toBe("modified");
    expect(field?.details?.added).toContain("theme");
  });

  it("detects removed json keys", () => {
    const base = { settings: { model: "opus", theme: "dark" } };
    const target = { settings: { model: "opus" } };
    const result = diffConfigs(claude, base, target);
    const field = result.fields.find((f) => f.field === "settings");
    expect(field?.change).toBe("modified");
    expect(field?.details?.removed).toContain("theme");
  });

  it("detects added dir files", () => {
    const base = { commands: { "review.md": "content" } };
    const target = { commands: { "review.md": "content", "test.md": "new" } };
    const result = diffConfigs(claude, base, target);
    const field = result.fields.find((f) => f.field === "commands");
    expect(field?.change).toBe("modified");
    expect(field?.details?.added).toContain("test.md");
  });

  it("detects modified dir files", () => {
    const base = { commands: { "review.md": "old" } };
    const target = { commands: { "review.md": "new" } };
    const result = diffConfigs(claude, base, target);
    const field = result.fields.find((f) => f.field === "commands");
    expect(field?.change).toBe("modified");
    expect(field?.details?.modified).toContain("review.md");
  });

  it("handles both sides empty", () => {
    const result = diffConfigs(claude, {}, {});
    expect(result.hasChanges).toBe(false);
    expect(result.fields.every((f) => f.change === "unchanged")).toBe(true);
  });
});
