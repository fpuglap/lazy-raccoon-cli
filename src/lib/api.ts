import type { Credentials, ConfigData, ConfigResponse } from "../types/index.js";

async function safeJsonParse(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function request(
  creds: Credentials,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${creds.api_url}/api${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.token}`,
        ...options.headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw new Error("Could not connect to server. Check your internet connection.");
  }

  if (res.status === 401) {
    console.error("Error: Session expired. Run `lazy login` again.");
    process.exit(1);
  }

  return res;
}

export async function pushConfig(
  creds: Credentials,
  name: string,
  data: ConfigData
): Promise<ConfigResponse> {
  const res = await request(creds, "/configs", {
    method: "POST",
    body: JSON.stringify({ name, data }),
  });

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to push config");
  }

  return res.json();
}

export async function pullConfig(
  creds: Credentials,
  name: string
): Promise<ConfigResponse> {
  const res = await request(creds, `/configs/latest?name=${name}`);

  if (res.status === 404) {
    throw new Error("No config found. Run `lazy push` first.");
  }

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to pull config");
  }

  return res.json();
}

export async function listConfigs(
  creds: Credentials
): Promise<ConfigResponse[]> {
  const res = await request(creds, "/configs");

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to list configs");
  }

  return res.json();
}
