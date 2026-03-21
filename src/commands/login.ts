import { createServer } from "http";
import { hostname } from "os";
import open from "open";
import ora from "ora";
import chalk from "chalk";
import { saveCredentials } from "../lib/credentials.js";
import { DEFAULT_API_URL, AUTH_CALLBACK_PORT, AUTH_TIMEOUT_MS } from "../lib/constants.js";

const PORT = AUTH_CALLBACK_PORT;

export async function login() {
  const apiUrl = DEFAULT_API_URL;
  const deviceName = hostname()
    .replace(/\.local$/, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const authUrl = `${apiUrl}/cli-auth?device=${encodeURIComponent(deviceName)}`;

  const spinner = ora("Waiting for browser authentication...").start();

  // Start local server to receive callback
  const token = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${PORT}`);

      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token");

        if (token) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="background:#000;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
                <div style="text-align:center">
                  <h1>Logged in!</h1>
                  <p>You can close this tab and return to your terminal.</p>
                </div>
              </body>
            </html>
          `);
          server.close();
          resolve(token);
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing token");
          server.close();
          reject(new Error("No token received"));
        }
      }
    });

    process.on("SIGINT", () => {
      server.close();
      spinner.stop();
      console.log("\nCancelled.");
      process.exit(0);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${PORT} is already in use. Close the other process and try again.`));
      } else {
        reject(new Error(`Could not start local server: ${err.message}`));
      }
    });

    server.listen(PORT, () => {
      // Open browser
      open(authUrl).catch(() => {
        spinner.stop();
        console.log(
          chalk.yellow(
            `Could not open browser. Open this URL manually:\n${authUrl}`
          )
        );
      });
    });

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Login timed out. Try again."));
    }, AUTH_TIMEOUT_MS);
    timeout.unref();
  });

  // Fetch actual email from API
  let email = "authenticated";
  try {
    const res = await fetch(`${apiUrl}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const me = await res.json();
      if (me.email) email = me.email;
    }
  } catch {}

  saveCredentials({
    token,
    email,
    api_url: apiUrl,
  });

  spinner.succeed(chalk.green("Logged in successfully!"));
  process.exit(0);
}
