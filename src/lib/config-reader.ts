import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { CLAUDE_DIR } from "./constants.js";
import type { ConfigData } from "../types/index.js";

function readFileIfExists(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  return readFileSync(path, "utf-8");
}

function readJsonIfExists(path: string): Record<string, unknown> | undefined {
  const content = readFileIfExists(path);
  if (!content) return undefined;
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

function readDirMarkdown(dirPath: string): Record<string, string> | undefined {
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) return undefined;

  const result: Record<string, string> = {};
  const entries = readdirSync(dirPath, { recursive: true });

  for (const entry of entries) {
    const entryStr = String(entry);
    const fullPath = join(dirPath, entryStr);
    if (statSync(fullPath).isFile() && entryStr.endsWith(".md")) {
      result[entryStr] = readFileSync(fullPath, "utf-8");
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function readClaudeConfig(claudeDir: string = CLAUDE_DIR): ConfigData {
  if (!existsSync(claudeDir)) {
    console.error(`Error: No Claude Code configuration found at ${claudeDir}.`);
    process.exit(1);
  }

  return {
    claude_md: readFileIfExists(join(claudeDir, "CLAUDE.md")),
    settings: readJsonIfExists(join(claudeDir, "settings.json")),
    mcp_servers: readJsonIfExists(join(claudeDir, ".mcp.json")),
    commands: readDirMarkdown(join(claudeDir, "commands")),
    agents: readDirMarkdown(join(claudeDir, "agents")),
    skills: readDirMarkdown(join(claudeDir, "skills")),
    rules: readDirMarkdown(join(claudeDir, "rules")),
  };
}
