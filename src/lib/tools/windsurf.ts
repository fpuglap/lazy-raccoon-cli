import { homedir } from "os";
import { join } from "path";
import type { ToolDefinition } from "./types.js";
import { makeDirGetter } from "./types.js";

export const windsurf: ToolDefinition = {
  id: "windsurf",
  label: "Windsurf",
  getDir: makeDirGetter(join(homedir(), ".codeium", "windsurf")),
  files: [
    { key: "instructions", path: join("memories", "global_rules.md"), type: "text", label: "global_rules.md" },
  ],
};
