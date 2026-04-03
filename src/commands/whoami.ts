import chalk from "chalk";
import { requireAuth } from "../lib/credentials.js";
import { getMe } from "../lib/api.js";
import { withSpinner } from "../lib/spinner.js";

export async function whoami() {
  const creds = await requireAuth();

  const user = await withSpinner("Fetching user info...", async (s) => {
    const me = await getMe(creds);
    s.stop();
    return me;
  });

  console.log(chalk.white(user.email));
}
