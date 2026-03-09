import { homedir } from "os";
import { join } from "path";
import type { ToolDefinition } from "./types.js";
import { makeDirGetter } from "./types.js";

export const gemini: ToolDefinition = {
  id: "gemini",
  label: "Gemini CLI",
  getDir: makeDirGetter(join(homedir(), ".gemini")),
  files: [
    { key: "instructions", path: "GEMINI.md", type: "text", label: "GEMINI.md" },
    { key: "settings", path: "settings.json", type: "json", label: "settings.json" },
    { key: "commands", path: "commands", type: "dir", extensions: [".toml", ".md"], label: "commands/" },
  ],
};
