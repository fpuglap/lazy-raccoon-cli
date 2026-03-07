import { createServer } from "http";
import open from "open";
import ora from "ora";
import chalk from "chalk";
import { saveCredentials } from "../lib/credentials.js";
import { DEFAULT_API_URL } from "../lib/constants.js";

const PORT = 9876;

export async function login() {
  const apiUrl = DEFAULT_API_URL;
  const authUrl = `${apiUrl}/cli-auth`;

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
    setTimeout(() => {
      server.close();
      reject(new Error("Login timed out. Try again."));
    }, 120_000);
  });

  // TODO: decode token to get email, or fetch from API
  saveCredentials({
    token,
    email: "authenticated",
    api_url: apiUrl,
  });

  spinner.succeed(chalk.green("Logged in successfully!"));
}
