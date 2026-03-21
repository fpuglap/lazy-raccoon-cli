import { describe, it, expect } from "vitest";
import { mergeConfigs } from "../lib/merge.js";
import { claude } from "../lib/tools/claude.js";

describe("mergeConfigs", () => {
  it("overlay wins on text conflicts", () => {
    const base = { claude_md: "base content" };
    const overlay = { claude_md: "overlay content" };
    const result = mergeConfigs(claude, base, overlay);
    expect(result.claude_md).toBe("overlay content");
  });

  it("preserves base-only text fields", () => {
    const base = { claude_md: "base content", settings: { model: "opus" } };
    const overlay = {};
    const result = mergeConfigs(claude, base, overlay);
    expect(result.claude_md).toBe("base content");
    expect(result.settings).toEqual({ model: "opus" });
  });

  it("overlay wins on json conflicts, preserves base-only keys", () => {
    const base = { settings: { model: "sonnet", theme: "dark" } };
    const overlay = { settings: { model: "opus" } };
    const result = mergeConfigs(claude, base, overlay);
    expect(result.settings).toEqual({ model: "opus", theme: "dark" });
  });

  it("overlay wins on dir conflicts, preserves base-only files", () => {
    const base = { commands: { "review.md": "old", "test.md": "test content" } };
    const overlay = { commands: { "review.md": "new" } };
    const result = mergeConfigs(claude, base, overlay);
    expect(result.commands).toEqual({ "review.md": "new", "test.md": "test content" });
  });

  it("handles both sides empty", () => {
    const result = mergeConfigs(claude, {}, {});
    expect(result.claude_md).toBeUndefined();
    expect(result.settings).toBeUndefined();
    expect(result.commands).toBeUndefined();
  });

  it("handles overlay-only fields", () => {
    const base = {};
    const overlay = { claude_md: "new content" };
    const result = mergeConfigs(claude, base, overlay);
    expect(result.claude_md).toBe("new content");
  });
});
