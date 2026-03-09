import type { ToolDefinition } from "./types.js";
import { claude } from "./claude.js";
import { cursor } from "./cursor.js";
import { copilot } from "./copilot.js";
import { gemini } from "./gemini.js";
import { windsurf } from "./windsurf.js";
import { cline } from "./cline.js";

// Registry: add new tools here
const TOOLS: Record<string, ToolDefinition> = {
  claude,
  cursor,
  copilot,
  gemini,
  windsurf,
  cline,
};

export function getTool(id: string): ToolDefinition {
  const tool = TOOLS[id];
  if (!tool) {
    const valid = Object.keys(TOOLS).join(", ");
    throw new Error(`Unknown tool "${id}". Valid tools: ${valid}`);
  }
  return tool;
}

export function getToolIds(): string[] {
  return Object.keys(TOOLS);
}

export function getToolLabels(): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [id, tool] of Object.entries(TOOLS)) {
    labels[id] = tool.label;
  }
  return labels;
}

export { TOOLS };
export type { ToolDefinition, FileMapping, FileType } from "./types.js";
