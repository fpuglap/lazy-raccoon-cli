import { existsSync, writeFileSync, mkdirSync, cpSync } from "fs";
import { join, dirname } from "path";
import { CLAUDE_DIR } from "./constants.js";
import type { ConfigData } from "../types/index.js";

function backupClaude(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = `${CLAUDE_DIR}.backup.${timestamp}`;
  cpSync(CLAUDE_DIR, backupDir, { recursive: true });
  return backupDir;
}

function writeFileEnsureDir(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function writeDirMarkdown(
  dirPath: string,
  files: Record<string, string>
): void {
  for (const [relativePath, content] of Object.entries(files)) {
    writeFileEnsureDir(join(dirPath, relativePath), content);
  }
}

export function writeClaudeConfig(data: ConfigData): string {
  // Backup existing config
  let backupPath = "";
  if (existsSync(CLAUDE_DIR)) {
    backupPath = backupClaude();
  } else {
    mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  if (data.claude_md) {
    writeFileEnsureDir(join(CLAUDE_DIR, "CLAUDE.md"), data.claude_md);
  }

  if (data.settings) {
    writeFileEnsureDir(
      join(CLAUDE_DIR, "settings.json"),
      JSON.stringify(data.settings, null, 2)
    );
  }

  if (data.mcp_servers) {
    writeFileEnsureDir(
      join(CLAUDE_DIR, ".mcp.json"),
      JSON.stringify(data.mcp_servers, null, 2)
    );
  }

  if (data.commands) {
    writeDirMarkdown(join(CLAUDE_DIR, "commands"), data.commands);
  }

  if (data.agents) {
    writeDirMarkdown(join(CLAUDE_DIR, "agents"), data.agents);
  }

  if (data.skills) {
    writeDirMarkdown(join(CLAUDE_DIR, "skills"), data.skills);
  }

  if (data.rules) {
    writeDirMarkdown(join(CLAUDE_DIR, "rules"), data.rules);
  }

  return backupPath;
}
