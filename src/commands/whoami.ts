import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";

export async function whoami() {
  const creds = requireAuth();

  const res = await fetch(`${creds.api_url}/api/me`, {
    headers: {
      Authorization: `Bearer ${creds.token}`,
    },
  });

  if (res.status === 401) {
    console.error("Error: Session expired. Run `lazy login` again.");
    process.exit(1);
  }

  if (!res.ok) {
    console.error("Error: Could not fetch user info.");
    process.exit(1);
  }

  const user = await res.json();
  console.log(chalk.white(user.email));
}
