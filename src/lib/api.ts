import type { Credentials, ConfigData, ConfigResponse } from "../types/index.js";

async function request(
  creds: Credentials,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${creds.api_url}/api${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${creds.token}`,
      ...options.headers,
    },
  });

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
    const err = await res.json();
    throw new Error(err.error || "Failed to push config");
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
    const err = await res.json();
    throw new Error(err.error || "Failed to pull config");
  }

  return res.json();
}

export async function listConfigs(
  creds: Credentials
): Promise<ConfigResponse[]> {
  const res = await request(creds, "/configs");

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to list configs");
  }

  return res.json();
}
