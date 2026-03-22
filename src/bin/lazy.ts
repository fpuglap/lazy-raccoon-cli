import { createRequire } from "module";
import chalk from "chalk";
import { Command } from "commander";
import { login } from "../commands/login.js";
import { logout } from "../commands/logout.js";
import { push } from "../commands/push.js";
import { pull } from "../commands/pull.js";
import { status } from "../commands/status.js";
import { whoami } from "../commands/whoami.js";
import {
  teamsList,
  teamsCreate,
  teamsInfo,
  teamsInvite,
  teamsLeave,
  teamsInvitations,
  teamsAccept,
} from "../commands/teams.js";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

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
  .version(version);

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
  .option("-T, --team <slug>", "Push to a team config")
  .option("-m, --message <text>", "Add a message describing this change")
  .action(push);

program
  .command("pull")
  .description("Pull your config from the cloud")
  .option("-f, --force", "Full overwrite (skip merge)")
  .option("-p, --profile <name>", "Profile to sync (e.g. adoreal)")
  .option("-t, --tool <id>", "AI tool (claude, cursor, copilot, gemini, windsurf, cline)", "claude")
  .option("-d, --dir <path>", "Target directory (overrides default)")
  .option("-T, --team <slug>", "Pull from a team config")
  .action(pull);

program
  .command("status")
  .description("Show your synced configs")
  .action(status);

program
  .command("whoami")
  .description("Show current logged-in user")
  .action(whoami);

const teamsCmd = program
  .command("teams")
  .description("Manage teams")
  .action(teamsList);

teamsCmd
  .command("create <name>")
  .description("Create a new team")
  .action(teamsCreate);

teamsCmd
  .command("info <slug>")
  .description("Show team details")
  .action(teamsInfo);

teamsCmd
  .command("invite <slug> <email>")
  .description("Invite a user to a team")
  .action(teamsInvite);

teamsCmd
  .command("leave <slug>")
  .description("Leave a team")
  .action(teamsLeave);

teamsCmd
  .command("invitations")
  .description("List pending invitations")
  .action(teamsInvitations);

teamsCmd
  .command("accept <id>")
  .description("Accept a team invitation")
  .action(teamsAccept);

program.parse();
