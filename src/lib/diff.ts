import chalk from "chalk";
import type { ToolDefinition } from "./tools/index.js";
import type { ConfigData, DiffResult, FieldDiff } from "../types/index.js";

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

export function diffConfigs(
  tool: ToolDefinition,
  base: ConfigData,
  target: ConfigData
): DiffResult {
  const fields: FieldDiff[] = [];

  for (const file of tool.files) {
    const baseVal = base[file.key];
    const targetVal = target[file.key];

    switch (file.type) {
      case "text":
        fields.push(diffTextField(file.key, baseVal as string | undefined, targetVal as string | undefined));
        break;
      case "json":
        fields.push(diffJsonField(file.key, baseVal as Record<string, unknown> | undefined, targetVal as Record<string, unknown> | undefined));
        break;
      case "dir":
        fields.push(diffDirField(file.key, baseVal as Record<string, string> | undefined, targetVal as Record<string, string> | undefined));
        break;
    }
  }

  const hasChanges = fields.some((f) => f.change !== "unchanged");
  return { hasChanges, fields };
}

export function formatDiff(
  tool: ToolDefinition,
  diff: DiffResult,
  direction: "push" | "pull"
): string {
  // Build label map from tool definition
  const labels: Record<string, string> = {};
  for (const file of tool.files) {
    labels[file.key] = file.label;
  }

  const lines: string[] = [];
  const header = direction === "push" ? "Changes to push:" : "Changes to pull:";
  lines.push(chalk.bold(header));
  lines.push("");

  for (const field of diff.fields) {
    const label = labels[field.field] || field.field;
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

export function generateChangeSummary(
  tool: ToolDefinition,
  diff: DiffResult
): string {
  const labels: Record<string, string> = {};
  for (const file of tool.files) {
    labels[file.key] = file.label;
  }

  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];

  for (const field of diff.fields) {
    const label = labels[field.field] || field.field;
    switch (field.change) {
      case "added":
        if (field.details?.added.length) {
          for (const f of field.details.added) added.push(`${label}/${f}`);
        } else {
          added.push(label);
        }
        break;
      case "removed":
        if (field.details?.removed.length) {
          for (const f of field.details.removed) removed.push(`${label}/${f}`);
        } else {
          removed.push(label);
        }
        break;
      case "modified":
        if (field.details) {
          for (const f of field.details.added) added.push(`${label}/${f}`);
          for (const f of field.details.removed) removed.push(`${label}/${f}`);
          for (const f of field.details.modified) modified.push(`${label}/${f}`);
        } else {
          modified.push(label);
        }
        break;
    }
  }

  const parts: string[] = [];
  if (added.length) {
    parts.push(added.length <= 3
      ? `Added ${added.join(", ")}`
      : `Added ${added.length} files`);
  }
  if (modified.length) {
    parts.push(modified.length <= 3
      ? `Modified ${modified.join(", ")}`
      : `Modified ${modified.length} files`);
  }
  if (removed.length) {
    parts.push(removed.length <= 3
      ? `Removed ${removed.join(", ")}`
      : `Removed ${removed.length} files`);
  }

  return parts.join(", ") || "No changes";
}
