import type { ConfigData } from "../types/index.js";

// Merge two ConfigData objects. Overlay wins on conflicts, base-only fields preserved.
// For push: base=cloud, overlay=local
// For pull: base=local, overlay=cloud
export function mergeConfigs(base: ConfigData, overlay: ConfigData): ConfigData {
  return {
    claude_md: overlay.claude_md ?? base.claude_md,
    settings: mergeJson(base.settings, overlay.settings),
    mcp_servers: mergeJson(base.mcp_servers, overlay.mcp_servers),
    commands: mergeDir(base.commands, overlay.commands),
    agents: mergeDir(base.agents, overlay.agents),
    skills: mergeDir(base.skills, overlay.skills),
    rules: mergeDir(base.rules, overlay.rules),
  };
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
