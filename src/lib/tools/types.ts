import { homedir } from "os";
import { join } from "path";

export type FileType = "text" | "json" | "dir";

export interface FileMapping {
  /** Key used in ConfigData and the cloud DB */
  key: string;
  /** Relative path from the tool's root dir */
  path: string;
  /** How to read/write this file */
  type: FileType;
  /** File extensions to include (dir type only, default [".md"]) */
  extensions?: string[];
  /** Display label for diff output */
  label: string;
}

export interface ToolDefinition {
  /** Unique identifier stored in DB (e.g. "claude", "cursor") */
  id: string;
  /** Human-readable name (e.g. "Claude Code", "Cursor") */
  label: string;
  /** Get the root directory for this tool's global config */
  getDir: (profile?: string) => string;
  /** Files and directories to sync */
  files: FileMapping[];
}

/** Helper to build getDir with profile support */
export function makeDirGetter(
  defaultDir: string,
  profilePattern?: (profile: string) => string
): (profile?: string) => string {
  return (profile?: string) => {
    if (profile && profile !== "default" && profilePattern) {
      return profilePattern(profile);
    }
    return defaultDir;
  };
}
