import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { pullConfig } from "../lib/api.js";
import { readConfig } from "../lib/config-reader.js";
import { writeConfig } from "../lib/config-writer.js";
import { diffConfigs, formatDiff } from "../lib/diff.js";
import { mergeConfigs } from "../lib/merge.js";
import { confirm } from "../lib/prompt.js";
import { getConfigName, DEFAULT_TOOL } from "../lib/constants.js";
import { getTool } from "../lib/tools/index.js";
import type { ConfigData } from "../types/index.js";

export async function pull(options: {
  force?: boolean;
  profile?: string;
  dir?: string;
  tool?: string;
}) {
  const creds = requireAuth();
  const toolId = options.tool || DEFAULT_TOOL;
  const tool = getTool(toolId);
  const dir = options.dir
    || (options.profile
      ? tool.getDir(options.profile)
      : process.env.CLAUDE_DIR && toolId === "claude"
        ? process.env.CLAUDE_DIR
        : tool.getDir());
  const configName = getConfigName(options.profile);

  console.log(chalk.cyan(`Tool: ${tool.label}`));
  if (options.dir) {
    console.log(chalk.cyan(`Target directory: ${dir}`));
  } else if (options.profile) {
    console.log(chalk.cyan(`Profile: ${options.profile} (${dir})`));
  }
  console.log();

  // Read local config
  const localData = readConfig(tool, dir);

  // Fetch cloud config
  const spinner = ora("Fetching cloud config...").start();
  let cloudConfig;
  try {
    cloudConfig = await pullConfig(creds, configName, toolId);
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
    const diff = diffConfigs(tool, localData, cloudData);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to pull."));
      return;
    }
    console.log(formatDiff(tool, diff, "pull"));
    console.log(chalk.yellow("  --force: Local config will be fully overwritten with cloud config.\n"));
    dataToWrite = cloudData;
    forceWrite = true;
  } else {
    // Merge: cloud on top of local (cloud wins, local-only preserved)
    const merged = mergeConfigs(tool, localData, cloudData);
    const diff = diffConfigs(tool, localData, merged);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to pull."));
      return;
    }
    console.log(formatDiff(tool, diff, "pull"));
    dataToWrite = merged;
  }

  const confirmed = await confirm(chalk.yellow("Apply these changes locally?"));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const writeSpinner = ora("Writing config...").start();
  try {
    const backupPath = writeConfig(tool, dataToWrite, {
      force: forceWrite,
      dir,
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
