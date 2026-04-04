import { existsSync, writeFileSync, mkdirSync, cpSync, rmSync, unlinkSync, statSync, readdirSync } from "fs";
import { join, dirname, resolve, basename } from "path";
import type { ToolDefinition } from "./tools/index.js";
import type { ConfigData } from "../types/index.js";

function backupDir(dir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const randomStr = Math.random().toString(36).substring(2, 8);
  const backupPath = `${dir}.backup.${timestamp}-${randomStr}`;
  cpSync(dir, backupPath, { recursive: true });

  const parentDir = dirname(dir);
  const baseName = basename(dir);
  
  try {
    const backups = readdirSync(parentDir)
      .filter(name => name.startsWith(`${baseName}.backup.`))
      .sort((a, b) => b.localeCompare(a)); // sort descending

    if (backups.length > 5) {
      const toDelete = backups.slice(5);
      for (const oldBackup of toDelete) {
        rmSync(join(parentDir, oldBackup), { recursive: true, force: true });
      }
    }
  } catch (_error) {
    // Ignore best-effort cleanup failures
  }

  return backupPath;
}

function writeFileEnsureDir(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  let mode: number | undefined;
  try {
    mode = statSync(filePath).mode & 0o777;
  } catch {
    mode = undefined;
  }
  writeFileSync(filePath, content, mode !== undefined ? { mode } : {});
}

function writeDirFiles(dirPath: string, files: Record<string, string>): void {
  const resolvedBase = resolve(dirPath);
  for (const [relativePath, content] of Object.entries(files)) {
    const target = resolve(join(dirPath, relativePath));
    if (!target.startsWith(resolvedBase)) continue;
    writeFileEnsureDir(target, content);
  }
}

export function writeConfig(
  tool: ToolDefinition,
  data: ConfigData,
  options: { force?: boolean; dir: string }
): string {
  const { dir } = options;

  // Backup existing config
  let backupPath = "";
  if (existsSync(dir)) {
    backupPath = backupDir(dir);
  } else {
    mkdirSync(dir, { recursive: true });
  }

  for (const file of tool.files) {
    const fullPath = join(dir, file.path);
    const value = data[file.key];

    // In force mode, delete files/dirs not present in data
    if (options.force && !value) {
      if (existsSync(fullPath)) {
        if (file.type === "dir") {
          rmSync(fullPath, { recursive: true });
        } else {
          unlinkSync(fullPath);
        }
      }
      continue;
    }

    if (!value) continue;

    switch (file.type) {
      case "text":
        writeFileEnsureDir(fullPath, value as string);
        break;
      case "json":
        writeFileEnsureDir(
          fullPath,
          JSON.stringify(value as Record<string, unknown>, null, 2)
        );
        break;
      case "dir":
        writeDirFiles(fullPath, value as Record<string, string>);
        break;
    }
  }

  return backupPath;
}
