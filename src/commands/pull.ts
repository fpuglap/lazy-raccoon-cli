import { createInterface } from "readline";
import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { pullConfig } from "../lib/api.js";
import { writeClaudeConfig } from "../lib/config-writer.js";
import type { ConfigData } from "../types/index.js";

function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/n) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

export async function pull() {
  const creds = requireAuth();

  const confirmed = await confirm(
    chalk.yellow(
      "This will overwrite your local ~/.claude config. Continue?"
    )
  );

  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const spinner = ora("Pulling config...").start();

  try {
    const result = await pullConfig(creds, "default");
    const backupPath = writeClaudeConfig(result.data as ConfigData);

    if (backupPath) {
      spinner.succeed(
        chalk.green(
          `Config pulled (v${result.version}). Backup saved to ${backupPath}`
        )
      );
    } else {
      spinner.succeed(chalk.green(`Config pulled (v${result.version})`));
    }
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to pull config")
    );
    process.exit(1);
  }
}
