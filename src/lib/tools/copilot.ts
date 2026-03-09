import { homedir } from "os";
import { join } from "path";
import type { ToolDefinition } from "./types.js";
import { makeDirGetter } from "./types.js";

export const copilot: ToolDefinition = {
  id: "copilot",
  label: "GitHub Copilot",
  getDir: makeDirGetter(join(homedir(), ".copilot")),
  files: [
    { key: "instructions", path: "copilot-instructions.md", type: "text", label: "copilot-instructions.md" },
    { key: "config", path: "config.json", type: "json", label: "config.json" },
    { key: "mcp", path: "mcp-config.json", type: "json", label: "mcp-config.json" },
    { key: "agents", path: "agents", type: "dir", extensions: [".md"], label: "agents/" },
  ],
};
