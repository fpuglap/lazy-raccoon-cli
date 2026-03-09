import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";

export async function whoami() {
  const creds = requireAuth();

  let res: Response;
  try {
    res = await fetch(`${creds.api_url}/api/me`, {
      headers: {
        Authorization: `Bearer ${creds.token}`,
      },
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    console.error(chalk.red("Error: Could not connect to server. Check your internet connection."));
    process.exit(1);
  }

  if (res.status === 401) {
    console.error(chalk.red("Error: Session expired. Run `lazy login` again."));
    process.exit(1);
  }

  if (!res.ok) {
    console.error(chalk.red("Error: Could not fetch user info."));
    process.exit(1);
  }

  const user = await res.json();
  console.log(chalk.white(user.email));
}
