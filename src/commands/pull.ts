import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { pullConfig, getTeam } from "../lib/api.js";
import { readConfig } from "../lib/config-reader.js";
import { writeConfig } from "../lib/config-writer.js";
import { diffConfigs, formatDiff } from "../lib/diff.js";
import { mergeConfigs } from "../lib/merge.js";
import { confirm } from "../lib/prompt.js";
import { getConfigName, DEFAULT_TOOL } from "../lib/constants.js";
import { getTool } from "../lib/tools/index.js";
import { withSpinner } from "../lib/spinner.js";
import type { ConfigData } from "../types/index.js";

export async function pull(options: {
  force?: boolean;
  profile?: string;
  dir?: string;
  tool?: string;
  team?: string;
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

  // Resolve team slug to teamId
  let teamId: string | undefined;
  if (options.team) {
    teamId = await withSpinner("Resolving team...", async (s) => {
      const team = await getTeam(creds, options.team!);
      s.stop();
      return team.id;
    });
  }

  console.log(chalk.cyan(`Tool: ${tool.label}`));
  if (options.team) {
    console.log(chalk.cyan(`Team: ${options.team}`));
  }
  if (options.dir) {
    console.log(chalk.cyan(`Target directory: ${dir}`));
  } else if (options.profile) {
    console.log(chalk.cyan(`Profile: ${options.profile} (${dir})`));
  }
  console.log();

  // Read local config
  const localData = readConfig(tool, dir);

  // Fetch cloud config
  const cloudConfig = await withSpinner("Fetching cloud config...", async () => {
    return await pullConfig(creds, configName, toolId, teamId);
  });
  const cloudData = (cloudConfig.data as ConfigData) ?? {};

  let dataToWrite: ConfigData;
  let forceWrite = false;

  if (options.force) {
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

  await withSpinner("Writing config...", async (s) => {
    const backupPath = writeConfig(tool, dataToWrite, {
      force: forceWrite,
      dir,
    });

    if (backupPath) {
      s.succeed(chalk.green(`Config pulled (v${cloudConfig.version}). Backup: ${backupPath}`));
    } else {
      s.succeed(chalk.green(`Config pulled (v${cloudConfig.version})`));
    }
  });
}
