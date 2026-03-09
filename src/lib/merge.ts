import type { ToolDefinition } from "./tools/index.js";
import type { ConfigData } from "../types/index.js";

// Merge two ConfigData objects. Overlay wins on conflicts, base-only fields preserved.
// For push: base=cloud, overlay=local
// For pull: base=local, overlay=cloud
export function mergeConfigs(
  tool: ToolDefinition,
  base: ConfigData,
  overlay: ConfigData
): ConfigData {
  const result: ConfigData = {};

  for (const file of tool.files) {
    const baseVal = base[file.key];
    const overlayVal = overlay[file.key];

    switch (file.type) {
      case "text":
        result[file.key] = (overlayVal as string | undefined) ?? (baseVal as string | undefined);
        break;
      case "json":
        result[file.key] = mergeJson(
          baseVal as Record<string, unknown> | undefined,
          overlayVal as Record<string, unknown> | undefined
        );
        break;
      case "dir":
        result[file.key] = mergeDir(
          baseVal as Record<string, string> | undefined,
          overlayVal as Record<string, string> | undefined
        );
        break;
    }
  }

  return result;
}

function mergeJson(
  base: Record<string, unknown> | undefined,
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!base && !overlay) return undefined;
  if (!base) return overlay;
  if (!overlay) return base;
  return { ...base, ...overlay };
}

function mergeDir(
  base: Record<string, string> | undefined,
  overlay: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!base && !overlay) return undefined;
  if (!base) return overlay;
  if (!overlay) return base;
  return { ...base, ...overlay };
}
