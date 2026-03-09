import { existsSync, writeFileSync, mkdirSync, cpSync, rmSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { CLAUDE_DIR } from "./constants.js";
import type { ConfigData } from "../types/index.js";

function backupClaude(claudeDir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = `${claudeDir}.backup.${timestamp}`;
  cpSync(claudeDir, backupDir, { recursive: true });
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

export function writeClaudeConfig(
  data: ConfigData,
  options: { force?: boolean; claudeDir?: string } = {}
): string {
  const dir = options.claudeDir || CLAUDE_DIR;

  // Backup existing config
  let backupPath = "";
  if (existsSync(dir)) {
    backupPath = backupClaude(dir);
  } else {
    mkdirSync(dir, { recursive: true });
  }

  // In force mode, delete files/dirs not present in data
  if (options.force) {
    const singleFiles: [keyof ConfigData, string][] = [
      ["claude_md", "CLAUDE.md"],
      ["settings", "settings.json"],
      ["mcp_servers", ".mcp.json"],
    ];
    for (const [key, filename] of singleFiles) {
      if (!data[key]) {
        const p = join(dir, filename);
        if (existsSync(p)) unlinkSync(p);
      }
    }
    const dirs = ["commands", "agents", "skills", "rules"] as const;
    for (const d of dirs) {
      if (!data[d]) {
        const p = join(dir, d);
        if (existsSync(p)) rmSync(p, { recursive: true });
      }
    }
  }

  if (data.claude_md) {
    writeFileEnsureDir(join(dir, "CLAUDE.md"), data.claude_md);
  }

  if (data.settings) {
    writeFileEnsureDir(
      join(dir, "settings.json"),
      JSON.stringify(data.settings, null, 2)
    );
  }

  if (data.mcp_servers) {
    writeFileEnsureDir(
      join(dir, ".mcp.json"),
      JSON.stringify(data.mcp_servers, null, 2)
    );
  }

  if (data.commands) {
    writeDirMarkdown(join(dir, "commands"), data.commands);
  }

  if (data.agents) {
    writeDirMarkdown(join(dir, "agents"), data.agents);
  }

  if (data.skills) {
    writeDirMarkdown(join(dir, "skills"), data.skills);
  }

  if (data.rules) {
    writeDirMarkdown(join(dir, "rules"), data.rules);
  }

  return backupPath;
}
