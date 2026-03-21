import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { listConfigs } from "../lib/api.js";
import { withSpinner } from "../lib/spinner.js";

export async function status() {
  const creds = requireAuth();

  const configs = await withSpinner("Fetching configs...", async (s) => {
    const result = await listConfigs(creds);

    if (result.length === 0) {
      s.info("No configs found. Run `lazy push` to upload your first config.");
      process.exit(0);
    }

    s.stop();
    return result;
  });

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
}
