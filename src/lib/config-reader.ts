import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import type { ToolDefinition } from "./tools/index.js";
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

function readDirFiles(
  dirPath: string,
  extensions: string[] = [".md"]
): Record<string, string> | undefined {
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) return undefined;

  const result: Record<string, string> = {};
  const entries = readdirSync(dirPath, { recursive: true });

  for (const entry of entries) {
    const entryStr = String(entry);
    const fullPath = join(dirPath, entryStr);
    if (
      statSync(fullPath).isFile() &&
      extensions.some((ext) => extname(entryStr) === ext)
    ) {
      result[entryStr] = readFileSync(fullPath, "utf-8");
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function readConfig(tool: ToolDefinition, dir: string): ConfigData {
  if (!existsSync(dir)) {
    return {};
  }

  const data: ConfigData = {};

  for (const file of tool.files) {
    const fullPath = join(dir, file.path);

    switch (file.type) {
      case "text":
        data[file.key] = readFileIfExists(fullPath);
        break;
      case "json":
        data[file.key] = readJsonIfExists(fullPath);
        break;
      case "dir":
        data[file.key] = readDirFiles(fullPath, file.extensions);
        break;
    }
  }

  return data;
}
