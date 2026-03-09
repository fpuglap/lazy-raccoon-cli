import chalk from "chalk";
import { Command } from "commander";
import { login } from "../commands/login.js";
import { logout } from "../commands/logout.js";
import { push } from "../commands/push.js";
import { pull } from "../commands/pull.js";
import { status } from "../commands/status.js";
import { whoami } from "../commands/whoami.js";

process.on("uncaughtException", (err) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  const message = err instanceof Error ? err.message : "Something went wrong";
  console.error(chalk.red(`Error: ${message}`));
  process.exit(1);
});

const program = new Command();

program
  .name("lazy")
  .description("Sync your AI tool configs across machines.")
  .version("0.2.0");

program
  .command("login")
  .description("Log in to Lazy Raccoon")
  .action(login);

program
  .command("logout")
  .description("Log out of Lazy Raccoon")
  .action(logout);

program
  .command("push")
  .description("Push your config to the cloud")
  .option("-f, --force", "Full overwrite (skip merge)")
  .option("-p, --profile <name>", "Profile to sync (e.g. adoreal)")
  .option("-t, --tool <id>", "AI tool (claude, cursor, copilot, gemini, windsurf, cline)", "claude")
  .action(push);

program
  .command("pull")
  .description("Pull your config from the cloud")
  .option("-f, --force", "Full overwrite (skip merge)")
  .option("-p, --profile <name>", "Profile to sync (e.g. adoreal)")
  .option("-t, --tool <id>", "AI tool (claude, cursor, copilot, gemini, windsurf, cline)", "claude")
  .option("-d, --dir <path>", "Target directory (overrides default)")
  .action(pull);

program
  .command("status")
  .description("Show your synced configs")
  .action(status);

program
  .command("whoami")
  .description("Show current logged-in user")
  .action(whoami);

program.parse();
