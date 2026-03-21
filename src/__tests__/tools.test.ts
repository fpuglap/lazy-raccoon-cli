import { describe, it, expect } from "vitest";
import { getTool, getToolIds, TOOLS } from "../lib/tools/index.js";

describe("tools", () => {
  it("has all 6 tools registered", () => {
    const ids = getToolIds();
    expect(ids).toContain("claude");
    expect(ids).toContain("cursor");
    expect(ids).toContain("copilot");
    expect(ids).toContain("gemini");
    expect(ids).toContain("windsurf");
    expect(ids).toContain("cline");
    expect(ids).toHaveLength(6);
  });

  it("each tool has required fields", () => {
    for (const id of getToolIds()) {
      const tool = getTool(id);
      expect(tool.id).toBe(id);
      expect(tool.label).toBeTruthy();
      expect(typeof tool.getDir).toBe("function");
      expect(tool.files.length).toBeGreaterThan(0);
    }
  });

  it("each tool file mapping has required fields", () => {
    for (const id of getToolIds()) {
      const tool = getTool(id);
      for (const file of tool.files) {
        expect(file.key).toBeTruthy();
        expect(file.path).toBeTruthy();
        expect(file.label).toBeTruthy();
        expect(["text", "json", "dir"]).toContain(file.type);
      }
    }
  });

  it("throws on unknown tool", () => {
    expect(() => getTool("unknown")).toThrow('Unknown tool "unknown"');
  });

  it("getDir returns a string", () => {
    for (const id of getToolIds()) {
      const tool = getTool(id);
      const dir = tool.getDir();
      expect(typeof dir).toBe("string");
      expect(dir.length).toBeGreaterThan(0);
    }
  });
});
