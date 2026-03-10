import ora from "ora";
import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import {
  listTeams,
  getTeam,
  createTeam,
  inviteToTeam,
  leaveTeam,
  listInvitations,
  acceptInvite,
} from "../lib/api.js";
import { confirm } from "../lib/prompt.js";

export async function teamsList() {
  const creds = requireAuth();
  const spinner = ora("Fetching teams...").start();

  try {
    const teams = await listTeams(creds);

    if (teams.length === 0) {
      spinner.info("No teams found. Create one with `lazy teams create <name>`.");
      return;
    }

    spinner.stop();

    console.log(chalk.bold("\nYour teams:\n"));
    console.log(
      chalk.gray(
        `${"Name".padEnd(25)} ${"Slug".padEnd(20)} ${"Role"}`
      )
    );
    console.log(chalk.gray("─".repeat(55)));

    for (const team of teams) {
      const roleColor =
        team.role === "owner"
          ? chalk.magenta
          : team.role === "admin"
            ? chalk.blue
            : chalk.gray;

      console.log(
        `${team.name.padEnd(25)} ${chalk.gray(team.slug.padEnd(20))} ${roleColor(team.role || "member")}`
      );
    }

    console.log();
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to fetch teams")
    );
    process.exit(1);
  }
}

export async function teamsCreate(name: string) {
  const creds = requireAuth();
  const spinner = ora("Creating team...").start();

  try {
    const team = await createTeam(creds, name);
    spinner.succeed(
      chalk.green(`Team created: ${team.name} (/${team.slug})`)
    );
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to create team")
    );
    process.exit(1);
  }
}

export async function teamsInfo(slug: string) {
  const creds = requireAuth();
  const spinner = ora("Fetching team...").start();

  try {
    const team = await getTeam(creds, slug);
    spinner.stop();

    console.log(chalk.bold(`\n${team.name}`));
    console.log(chalk.gray(`/${team.slug}\n`));

    if (team.members && team.members.length > 0) {
      console.log(chalk.bold("Members:\n"));
      console.log(
        chalk.gray(
          `${"Name".padEnd(25)} ${"Email".padEnd(30)} ${"Role"}`
        )
      );
      console.log(chalk.gray("─".repeat(65)));

      const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
      const sorted = [...team.members].sort(
        (a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)
      );

      for (const m of sorted) {
        const roleColor =
          m.role === "owner"
            ? chalk.magenta
            : m.role === "admin"
              ? chalk.blue
              : chalk.gray;

        console.log(
          `${(m.username || "-").padEnd(25)} ${chalk.gray(m.email.padEnd(30))} ${roleColor(m.role)}`
        );
      }
    }

    console.log();
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to fetch team")
    );
    process.exit(1);
  }
}

export async function teamsInvite(slug: string, email: string) {
  const creds = requireAuth();
  const spinner = ora("Sending invitation...").start();

  try {
    const result = await inviteToTeam(creds, slug, email);
    spinner.succeed(chalk.green(`Invitation sent to ${email}`));
    console.log(chalk.gray(`Link: ${result.inviteLink}`));
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to invite")
    );
    process.exit(1);
  }
}

export async function teamsLeave(slug: string) {
  const creds = requireAuth();

  const confirmed = await confirm(chalk.yellow(`Leave team "${slug}"?`));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  const spinner = ora("Leaving team...").start();

  try {
    // Get team to find our userId from the members list
    const team = await getTeam(creds, slug);
    const selfMember = team.members?.find(
      (m) => m.role !== undefined
    );

    // We need our user id — get it from /api/me
    const meRes = await fetch(`${creds.api_url}/api/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (!meRes.ok) throw new Error("Could not get user info");
    const me = await meRes.json();

    // Find our member entry
    const myMember = team.members?.find((m) => m.email === me.email);
    if (!myMember) throw new Error("You are not a member of this team");

    await leaveTeam(creds, slug, myMember.userId);
    spinner.succeed(chalk.green(`Left team "${slug}"`));
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to leave team")
    );
    process.exit(1);
  }
}

export async function teamsInvitations() {
  const creds = requireAuth();
  const spinner = ora("Fetching invitations...").start();

  try {
    const invitations = await listInvitations(creds);

    if (invitations.length === 0) {
      spinner.info("No pending invitations.");
      return;
    }

    spinner.stop();

    console.log(chalk.bold("\nPending invitations:\n"));
    console.log(
      chalk.gray(
        `${"ID".padEnd(38)} ${"Team".padEnd(20)} ${"Role".padEnd(10)} ${"From"}`
      )
    );
    console.log(chalk.gray("─".repeat(80)));

    for (const inv of invitations) {
      console.log(
        `${chalk.gray(inv.id.padEnd(38))} ${inv.teamName.padEnd(20)} ${chalk.cyan(inv.role.padEnd(10))} ${chalk.gray(inv.invitedByUsername || inv.invitedByEmail)}`
      );
    }

    console.log(chalk.gray("\nAccept with: lazy teams accept <id>"));
    console.log();
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to fetch invitations")
    );
    process.exit(1);
  }
}

export async function teamsAccept(id: string) {
  const creds = requireAuth();
  const spinner = ora("Accepting invitation...").start();

  try {
    const result = await acceptInvite(creds, id);
    spinner.succeed(
      chalk.green(`Joined team "${result.teamName}" (/${result.teamSlug})`)
    );
  } catch (err) {
    spinner.fail(
      chalk.red(err instanceof Error ? err.message : "Failed to accept invitation")
    );
    process.exit(1);
  }
}
