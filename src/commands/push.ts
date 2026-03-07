import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { readClaudeConfig } from "../lib/config-reader.js";
import { pushConfig } from "../lib/api.js";

export async function push() {
  const creds = requireAuth();

  const spinner = ora("Reading Claude Code config...").start();
  const data = readClaudeConfig();

  spinner.text = "Pushing config...";
  try {
    const result = await pushConfig(creds, "default", data);
    spinner.succeed(
      chalk.green(`Config pushed (v${result.version})`)
    );
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to push config")
    );
    process.exit(1);
  }
}
