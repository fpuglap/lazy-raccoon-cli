import chalk from "chalk";
import type { ConfigData, DiffResult, FieldDiff } from "../types/index.js";

const TEXT_FIELDS = ["claude_md"] as const;
const JSON_FIELDS = ["settings", "mcp_servers"] as const;
const DIR_FIELDS = ["commands", "agents", "skills", "rules"] as const;

const FIELD_LABELS: Record<string, string> = {
  claude_md: "CLAUDE.md",
  settings: "settings.json",
  mcp_servers: ".mcp.json",
  commands: "commands/",
  agents: "agents/",
  skills: "skills/",
  rules: "rules/",
};

function diffTextField(
  field: string,
  base: string | undefined,
  target: string | undefined
): FieldDiff {
  if (!base && !target) return { field, change: "unchanged" };
  if (!base && target) return { field, change: "added" };
  if (base && !target) return { field, change: "removed" };
  if (base === target) return { field, change: "unchanged" };
  return { field, change: "modified" };
}

function diffJsonField(
  field: string,
  base: Record<string, unknown> | undefined,
  target: Record<string, unknown> | undefined
): FieldDiff {
  if (!base && !target) return { field, change: "unchanged" };
  if (!base && target) {
    return { field, change: "added", details: { added: Object.keys(target), removed: [], modified: [] } };
  }
  if (base && !target) {
    return { field, change: "removed", details: { added: [], removed: Object.keys(base), modified: [] } };
  }

  const baseKeys = new Set(Object.keys(base!));
  const targetKeys = new Set(Object.keys(target!));

  const added = [...targetKeys].filter((k) => !baseKeys.has(k));
  const removed = [...baseKeys].filter((k) => !targetKeys.has(k));
  const modified = [...baseKeys]
    .filter((k) => targetKeys.has(k))
    .filter((k) => JSON.stringify(base![k]) !== JSON.stringify(target![k]));

  if (added.length === 0 && removed.length === 0 && modified.length === 0) {
    return { field, change: "unchanged" };
  }

  return { field, change: "modified", details: { added, removed, modified } };
}

function diffDirField(
  field: string,
  base: Record<string, string> | undefined,
  target: Record<string, string> | undefined
): FieldDiff {
  if (!base && !target) return { field, change: "unchanged" };
  if (!base && target) {
    return { field, change: "added", details: { added: Object.keys(target), removed: [], modified: [] } };
  }
  if (base && !target) {
    return { field, change: "removed", details: { added: [], removed: Object.keys(base), modified: [] } };
  }

  const baseFiles = new Set(Object.keys(base!));
  const targetFiles = new Set(Object.keys(target!));

  const added = [...targetFiles].filter((f) => !baseFiles.has(f));
  const removed = [...baseFiles].filter((f) => !targetFiles.has(f));
  const modified = [...baseFiles]
    .filter((f) => targetFiles.has(f))
    .filter((f) => base![f] !== target![f]);

  if (added.length === 0 && removed.length === 0 && modified.length === 0) {
    return { field, change: "unchanged" };
  }

  return { field, change: "modified", details: { added, removed, modified } };
}

export function diffConfigs(base: ConfigData, target: ConfigData): DiffResult {
  const fields: FieldDiff[] = [];

  for (const f of TEXT_FIELDS) {
    fields.push(diffTextField(f, base[f], target[f]));
  }

  for (const f of JSON_FIELDS) {
    fields.push(diffJsonField(f, base[f], target[f]));
  }

  for (const f of DIR_FIELDS) {
    fields.push(diffDirField(f, base[f], target[f]));
  }

  const hasChanges = fields.some((f) => f.change !== "unchanged");
  return { hasChanges, fields };
}

export function formatDiff(diff: DiffResult, direction: "push" | "pull"): string {
  const lines: string[] = [];
  const header = direction === "push" ? "Changes to push:" : "Changes to pull:";
  lines.push(chalk.bold(header));
  lines.push("");

  for (const field of diff.fields) {
    const label = FIELD_LABELS[field.field] || field.field;
    const padded = label.padEnd(20);

    switch (field.change) {
      case "added":
        lines.push(`  ${chalk.green("+")} ${chalk.green(padded)} ${chalk.green("new")}`);
        if (field.details?.added.length) {
          for (const f of field.details.added) {
            lines.push(`    ${chalk.green(`+ ${f}`)}`);
          }
        }
        break;
      case "removed":
        lines.push(`  ${chalk.red("-")} ${chalk.red(padded)} ${chalk.red("removed")}`);
        if (field.details?.removed.length) {
          for (const f of field.details.removed) {
            lines.push(`    ${chalk.red(`- ${f}`)}`);
          }
        }
        break;
      case "modified":
        lines.push(`  ${chalk.yellow("~")} ${chalk.yellow(padded)} ${chalk.yellow("modified")}`);
        if (field.details) {
          for (const f of field.details.added) {
            lines.push(`    ${chalk.green(`+ ${f}`)}`);
          }
          for (const f of field.details.removed) {
            lines.push(`    ${chalk.red(`- ${f}`)}`);
          }
          for (const f of field.details.modified) {
            lines.push(`    ${chalk.yellow(`~ ${f}`)}`);
          }
        }
        break;
      case "unchanged":
        lines.push(`    ${chalk.gray(padded)} ${chalk.gray("unchanged")}`);
        break;
    }
  }

  lines.push("");
  return lines.join("\n");
}
