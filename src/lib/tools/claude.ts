import { homedir } from "os";
import { join } from "path";
import type { ToolDefinition } from "./types.js";
import { makeDirGetter } from "./types.js";

export const claude: ToolDefinition = {
  id: "claude",
  label: "Claude Code",
  getDir: makeDirGetter(
    join(homedir(), ".claude"),
    (profile) => join(homedir(), `.claude-${profile}`)
  ),
  files: [
    { key: "claude_md", path: "CLAUDE.md", type: "text", label: "CLAUDE.md" },
    { key: "settings", path: "settings.json", type: "json", label: "settings.json" },
    { key: "mcp_servers", path: ".mcp.json", type: "json", label: ".mcp.json" },
    { key: "commands", path: "commands", type: "dir", extensions: [".md"], label: "commands/" },
    { key: "agents", path: "agents", type: "dir", extensions: [".md"], label: "agents/" },
    { key: "skills", path: "skills", type: "dir", extensions: [".md"], label: "skills/" },
    { key: "rules", path: "rules", type: "dir", extensions: [".md"], label: "rules/" },
  ],
};
