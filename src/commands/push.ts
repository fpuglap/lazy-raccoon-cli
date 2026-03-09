import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { readClaudeConfig } from "../lib/config-reader.js";
import { pushConfig, pullConfig } from "../lib/api.js";
import { diffConfigs, formatDiff } from "../lib/diff.js";
import { mergeConfigs } from "../lib/merge.js";
import { confirm } from "../lib/prompt.js";
import { getClaudeDir, getConfigName } from "../lib/constants.js";
import type { ConfigData } from "../types/index.js";

export async function push(options: { force?: boolean; profile?: string }) {
  const creds = requireAuth();
  const claudeDir = getClaudeDir(options.profile);
  const configName = getConfigName(options.profile);

  if (options.profile) {
    console.log(chalk.cyan(`Profile: ${options.profile} (${claudeDir})\n`));
  }

  const spinner = ora("Reading local config...").start();
  const localData = readClaudeConfig(claudeDir);

  // Fetch cloud config for diff/merge
  spinner.text = "Fetching cloud config...";
  let cloudData: ConfigData | null = null;
  try {
    const cloudConfig = await pullConfig(creds, configName);
    cloudData = (cloudConfig.data as ConfigData) ?? null;
  } catch {
    // No cloud config yet (first push)
  }
  spinner.stop();

  let dataToPush: ConfigData;

  if (!cloudData) {
    // First push — no merge needed
    console.log(chalk.cyan("No cloud config found. This will be the first push."));
    dataToPush = localData;
  } else if (options.force) {
    // Force: full overwrite, cloud becomes exact copy of local
    const diff = diffConfigs(cloudData, localData);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to push."));
      return;
    }
    console.log(formatDiff(diff, "push"));
    console.log(chalk.yellow("  --force: Cloud will be fully overwritten with local config.\n"));
    dataToPush = localData;
  } else {
    // Merge: local on top of cloud (local wins, cloud-only preserved)
    const merged = mergeConfigs(cloudData, localData);
    const diff = diffConfigs(cloudData, merged);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to push."));
      return;
    }
    console.log(formatDiff(diff, "push"));
    dataToPush = merged;
  }

  const confirmed = await confirm(chalk.yellow("Push these changes?"));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const pushSpinner = ora("Pushing config...").start();
  try {
    const result = await pushConfig(creds, configName, dataToPush);
    pushSpinner.succeed(chalk.green(`Config pushed (v${result.version})`));
  } catch (err) {
    pushSpinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to push config")
    );
    process.exit(1);
  }
}
