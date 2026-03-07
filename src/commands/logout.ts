import chalk from "chalk";
import { deleteCredentials, getCredentials } from "../lib/credentials.js";

export async function logout() {
  const creds = getCredentials();
  if (!creds) {
    console.log("Already logged out.");
    return;
  }

  deleteCredentials();
  console.log(chalk.green("Logged out."));
}
