import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { listConfigs } from "../lib/api.js";

export async function status() {
  const creds = requireAuth();

  const spinner = ora("Fetching configs...").start();

  try {
    const configs = await listConfigs(creds);

    if (configs.length === 0) {
      spinner.info("No configs found. Run `lazy push` to upload your first config.");
      return;
    }

    spinner.stop();

    console.log(chalk.bold("\nYour configs:\n"));
    console.log(
      chalk.gray(
        `${"Name".padEnd(20)} ${"Version".padEnd(10)} ${"Last updated"}`
      )
    );
    console.log(chalk.gray("─".repeat(55)));

    for (const config of configs) {
      const date = new Date(config.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      console.log(
        `${config.name.padEnd(20)} ${chalk.cyan(`v${config.version}`.padEnd(10))} ${chalk.gray(date)}`
      );
    }

    console.log();
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to fetch configs")
    );
    process.exit(1);
  }
}
