export interface Credentials {
  token: string;
  email: string;
  api_url: string;
}

/** Generic config data — keys are defined by each tool's file mappings */
export interface ConfigData {
  [key: string]: string | Record<string, unknown> | Record<string, string> | undefined;
}

export interface ConfigResponse {
  id: string;
  name: string;
  tool?: string;
  version: number;
  hash?: string;
  data?: ConfigData;
  updatedAt: string;
}

export type FieldChangeType = "added" | "removed" | "modified" | "unchanged";

export interface FieldDiff {
  field: string;
  change: FieldChangeType;
  details?: { added: string[]; removed: string[]; modified: string[] };
}

export interface DiffResult {
  hasChanges: boolean;
  fields: FieldDiff[];
}
