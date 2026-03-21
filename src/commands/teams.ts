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
  getMe,
} from "../lib/api.js";
import { confirm } from "../lib/prompt.js";
import { withSpinner } from "../lib/spinner.js";

function roleColor(role: string) {
  if (role === "owner") return chalk.magenta(role);
  if (role === "admin") return chalk.blue(role);
  return chalk.gray(role);
}

export async function teamsList() {
  const creds = requireAuth();

  const teams = await withSpinner("Fetching teams...", async (s) => {
    const result = await listTeams(creds);

    if (result.length === 0) {
      s.info("No teams found. Create one with `lazy teams create <name>`.");
      process.exit(0);
    }

    s.stop();
    return result;
  });

  console.log(chalk.bold("\nYour teams:\n"));
  console.log(
    chalk.gray(
      `${"Name".padEnd(25)} ${"Slug".padEnd(20)} ${"Role"}`
    )
  );
  console.log(chalk.gray("─".repeat(55)));

  for (const team of teams) {
    console.log(
      `${team.name.padEnd(25)} ${chalk.gray(team.slug.padEnd(20))} ${roleColor(team.role || "member")}`
    );
  }

  console.log();
}

export async function teamsCreate(name: string) {
  const creds = requireAuth();

  await withSpinner("Creating team...", async (s) => {
    const team = await createTeam(creds, name);
    s.succeed(chalk.green(`Team created: ${team.name} (/${team.slug})`));
  });
}

export async function teamsInfo(slug: string) {
  const creds = requireAuth();

  const team = await withSpinner("Fetching team...", async (s) => {
    const result = await getTeam(creds, slug);
    s.stop();
    return result;
  });

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
      console.log(
        `${(m.username || "-").padEnd(25)} ${chalk.gray(m.email.padEnd(30))} ${roleColor(m.role)}`
      );
    }
  }

  console.log();
}

export async function teamsInvite(slug: string, email: string) {
  const creds = requireAuth();

  await withSpinner("Sending invitation...", async (s) => {
    const result = await inviteToTeam(creds, slug, email);
    s.succeed(chalk.green(`Invitation sent to ${email}`));
    console.log(chalk.gray(`Link: ${result.inviteLink}`));
  });
}

export async function teamsLeave(slug: string) {
  const creds = requireAuth();

  const confirmed = await confirm(chalk.yellow(`Leave team "${slug}"?`));
  if (!confirmed) {
    console.log("Cancelled.");
    return;
  }

  await withSpinner("Leaving team...", async (s) => {
    const team = await getTeam(creds, slug);
    const me = await getMe(creds);

    const myMember = team.members?.find((m) => m.email === me.email);
    if (!myMember) throw new Error("You are not a member of this team");

    await leaveTeam(creds, slug, myMember.userId);
    s.succeed(chalk.green(`Left team "${slug}"`));
  });
}

export async function teamsInvitations() {
  const creds = requireAuth();

  const invitations = await withSpinner("Fetching invitations...", async (s) => {
    const result = await listInvitations(creds);

    if (result.length === 0) {
      s.info("No pending invitations.");
      process.exit(0);
    }

    s.stop();
    return result;
  });

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
}

export async function teamsAccept(id: string) {
  const creds = requireAuth();

  await withSpinner("Accepting invitation...", async (s) => {
    const result = await acceptInvite(creds, id);
    s.succeed(chalk.green(`Joined team "${result.teamName}" (/${result.teamSlug})`));
  });
}
