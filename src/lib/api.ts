import type { Credentials, ConfigData, ConfigResponse } from "../types/index.js";

async function safeJsonParse(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return { error: `Server returned ${res.status} with no details` };
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
  tool: string,
  data: ConfigData,
  teamId?: string
): Promise<ConfigResponse> {
  const res = await request(creds, "/configs", {
    method: "POST",
    body: JSON.stringify({ name, tool, data, ...(teamId && { teamId }) }),
  });

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to push config");
  }

  return res.json();
}

export async function pullConfig(
  creds: Credentials,
  name: string,
  tool: string,
  teamId?: string
): Promise<ConfigResponse> {
  let path = `/configs/latest?name=${name}&tool=${tool}`;
  if (teamId) path += `&teamId=${teamId}`;

  const res = await request(creds, path);

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

// User API

export async function getMe(creds: Credentials): Promise<{ email: string; username: string | null }> {
  const res = await request(creds, "/me");

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Could not fetch user info");
  }

  return res.json();
}

// Teams API

export interface TeamResponse {
  id: string;
  name: string;
  slug: string;
  role?: string;
  createdAt?: string;
  members?: Array<{
    userId: string;
    email: string;
    username: string | null;
    role: string;
  }>;
}

export interface InvitationResponse {
  id: string;
  teamName: string;
  teamSlug: string;
  role: string;
  status: string;
  invitedByEmail: string;
  invitedByUsername: string | null;
}

export async function listTeams(
  creds: Credentials
): Promise<TeamResponse[]> {
  const res = await request(creds, "/teams");

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to list teams");
  }

  return res.json();
}

export async function getTeam(
  creds: Credentials,
  slug: string
): Promise<TeamResponse> {
  const res = await request(creds, `/teams/${slug}`);

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to get team");
  }

  return res.json();
}

export async function createTeam(
  creds: Credentials,
  name: string
): Promise<TeamResponse> {
  const res = await request(creds, "/teams", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to create team");
  }

  return res.json();
}

export async function inviteToTeam(
  creds: Credentials,
  slug: string,
  email: string,
  role: string = "member"
): Promise<{ inviteLink: string }> {
  const res = await request(creds, `/teams/${slug}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to invite");
  }

  return res.json();
}

export async function leaveTeam(
  creds: Credentials,
  slug: string,
  userId: string
): Promise<void> {
  const res = await request(creds, `/teams/${slug}/members/${userId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to leave team");
  }
}

export async function listInvitations(
  creds: Credentials
): Promise<InvitationResponse[]> {
  const res = await request(creds, "/invitations");

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to list invitations");
  }

  return res.json();
}

export async function acceptInvite(
  creds: Credentials,
  invitationId: string
): Promise<{ teamSlug: string; teamName: string }> {
  const res = await request(creds, `/invitations/${invitationId}/accept`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await safeJsonParse(res);
    throw new Error((body.error as string) || "Failed to accept invitation");
  }

  return res.json();
}
