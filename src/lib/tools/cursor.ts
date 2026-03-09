import { homedir } from "os";
import { join } from "path";
import type { ToolDefinition } from "./types.js";
import { makeDirGetter } from "./types.js";

export const cursor: ToolDefinition = {
  id: "cursor",
  label: "Cursor",
  getDir: makeDirGetter(join(homedir(), ".cursor")),
  files: [
    { key: "rules", path: "rules", type: "dir", extensions: [".md", ".mdc"], label: "rules/" },
    { key: "mcp", path: "mcp.json", type: "json", label: "mcp.json" },
  ],
};
