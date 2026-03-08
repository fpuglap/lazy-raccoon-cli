import { Command } from "commander";
import { login } from "../commands/login.js";
import { logout } from "../commands/logout.js";
import { push } from "../commands/push.js";
import { pull } from "../commands/pull.js";
import { status } from "../commands/status.js";
import { whoami } from "../commands/whoami.js";

const program = new Command();

program
  .name("lazy")
  .description("Sync your Claude Code config across machines.")
  .version("0.1.0");

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
  .description("Push your Claude Code config to the cloud")
  .option("-f, --force", "Full overwrite (skip merge)")
  .action(push);

program
  .command("pull")
  .description("Pull your Claude Code config from the cloud")
  .option("-f, --force", "Full overwrite (skip merge)")
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
