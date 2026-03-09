import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { pullConfig } from "../lib/api.js";
import { readClaudeConfig } from "../lib/config-reader.js";
import { writeClaudeConfig } from "../lib/config-writer.js";
import { diffConfigs, formatDiff } from "../lib/diff.js";
import { mergeConfigs } from "../lib/merge.js";
import { confirm } from "../lib/prompt.js";
import { getClaudeDir, getConfigName } from "../lib/constants.js";
import type { ConfigData } from "../types/index.js";

export async function pull(options: { force?: boolean; profile?: string }) {
  const creds = requireAuth();
  const claudeDir = getClaudeDir(options.profile);
  const configName = getConfigName(options.profile);

  if (options.profile) {
    console.log(chalk.cyan(`Profile: ${options.profile} (${claudeDir})\n`));
  }

  // Read local config
  const localData = readClaudeConfig(claudeDir);

  // Fetch cloud config
  const spinner = ora("Fetching cloud config...").start();
  let cloudConfig;
  try {
    cloudConfig = await pullConfig(creds, configName);
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to pull config")
    );
    process.exit(1);
  }
  const cloudData = (cloudConfig.data as ConfigData) ?? {};
  spinner.stop();

  let dataToWrite: ConfigData;
  let forceWrite = false;

  if (options.force) {
    // Force: cloud fully overwrites local
    const diff = diffConfigs(localData, cloudData);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to pull."));
      return;
    }
    console.log(formatDiff(diff, "pull"));
    console.log(chalk.yellow("  --force: Local config will be fully overwritten with cloud config.\n"));
    dataToWrite = cloudData;
    forceWrite = true;
  } else {
    // Merge: cloud on top of local (cloud wins, local-only preserved)
    const merged = mergeConfigs(localData, cloudData);
    const diff = diffConfigs(localData, merged);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to pull."));
      return;
    }
    console.log(formatDiff(diff, "pull"));
    dataToWrite = merged;
  }

  const confirmed = await confirm(chalk.yellow("Apply these changes locally?"));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const writeSpinner = ora("Writing config...").start();
  try {
    const backupPath = writeClaudeConfig(dataToWrite, {
      force: forceWrite,
      claudeDir,
    });

    if (backupPath) {
      writeSpinner.succeed(
        chalk.green(`Config pulled (v${cloudConfig.version}). Backup: ${backupPath}`)
      );
    } else {
      writeSpinner.succeed(chalk.green(`Config pulled (v${cloudConfig.version})`));
    }
  } catch (err) {
    writeSpinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to write config")
    );
    process.exit(1);
  }
}
