import { homedir } from "os";
import { join } from "path";
import type { ToolDefinition } from "./types.js";
import { makeDirGetter } from "./types.js";

export const cline: ToolDefinition = {
  id: "cline",
  label: "Cline",
  getDir: makeDirGetter(join(homedir(), ".cline")),
  files: [
    { key: "mcp", path: "cline_mcp_settings.json", type: "json", label: "cline_mcp_settings.json" },
  ],
};
