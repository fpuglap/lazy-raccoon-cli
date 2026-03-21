import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { readConfig } from "../lib/config-reader.js";
import { pushConfig, pullConfig, getTeam } from "../lib/api.js";
import { diffConfigs, formatDiff } from "../lib/diff.js";
import { mergeConfigs } from "../lib/merge.js";
import { confirm } from "../lib/prompt.js";
import { getConfigName, DEFAULT_TOOL } from "../lib/constants.js";
import { getTool } from "../lib/tools/index.js";
import { withSpinner } from "../lib/spinner.js";
import type { ConfigData } from "../types/index.js";

export async function push(options: { force?: boolean; profile?: string; tool?: string; team?: string }) {
  const creds = requireAuth();
  const toolId = options.tool || DEFAULT_TOOL;
  const tool = getTool(toolId);
  const dir = options.profile
    ? tool.getDir(options.profile)
    : process.env.CLAUDE_DIR && toolId === "claude"
      ? process.env.CLAUDE_DIR
      : tool.getDir();
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
  if (options.profile) {
    console.log(chalk.cyan(`Profile: ${options.profile} (${dir})`));
  }
  console.log();

  const localData = await withSpinner("Reading local config...", async (s) => {
    const data = readConfig(tool, dir);
    if (Object.values(data).every((v) => v === undefined)) {
      throw new Error(`No ${tool.label} configuration found at ${dir}`);
    }

    // Fetch cloud config for diff/merge
    s.text = "Fetching cloud config...";
    let cloudData: ConfigData | null = null;
    try {
      const cloudConfig = await pullConfig(creds, configName, toolId, teamId);
      cloudData = (cloudConfig.data as ConfigData) ?? null;
    } catch {
      // No cloud config yet (first push)
    }
    s.stop();

    return { local: data, cloud: cloudData };
  });

  let dataToPush: ConfigData;

  if (!localData.cloud) {
    console.log(chalk.cyan("No cloud config found. This will be the first push."));
    dataToPush = localData.local;
  } else if (options.force) {
    const diff = diffConfigs(tool, localData.cloud, localData.local);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to push."));
      return;
    }
    console.log(formatDiff(tool, diff, "push"));
    console.log(chalk.yellow("  --force: Cloud will be fully overwritten with local config.\n"));
    dataToPush = localData.local;
  } else {
    const merged = mergeConfigs(tool, localData.cloud, localData.local);
    const diff = diffConfigs(tool, localData.cloud, merged);
    if (!diff.hasChanges) {
      console.log(chalk.gray("No changes to push."));
      return;
    }
    console.log(formatDiff(tool, diff, "push"));
    dataToPush = merged;
  }

  const confirmed = await confirm(chalk.yellow("Push these changes?"));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  await withSpinner("Pushing config...", async (s) => {
    const result = await pushConfig(creds, configName, toolId, dataToPush, teamId);
    s.succeed(chalk.green(`Config pushed (v${result.version})`));
  });
}
