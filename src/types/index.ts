export interface Credentials {
  token: string;
  email: string;
  api_url: string;
}

export interface ConfigData {
  claude_md?: string;
  settings?: Record<string, unknown>;
  mcp_servers?: Record<string, unknown>;
  commands?: Record<string, string>;
  agents?: Record<string, string>;
  skills?: Record<string, string>;
  rules?: Record<string, string>;
}

export interface ConfigResponse {
  id: string;
  name: string;
  version: number;
  hash?: string;
  data?: ConfigData;
  updatedAt: string;
}
