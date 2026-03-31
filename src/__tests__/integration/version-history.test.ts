import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  pushConfigApi,
  pullConfigApi,
  getConfigVersions,
  rollbackConfig,
  deleteConfig,
  API_KEY,
} from "./helpers.js";

const CONFIG_NAME = `e2e-versions-${Date.now()}`;
let configId: string;

beforeAll(() => {
  if (!API_KEY) throw new Error("E2E_API_KEY not set. Run the seed script first.");
});

afterAll(async () => {
  if (configId) await deleteConfig(configId).catch(() => {});
});

describe("version history and rollback", () => {
  it("push v1", async () => {
    const result = await pushConfigApi(CONFIG_NAME, "claude", { claude_md: "# Version 1" });
    configId = result.id;
    expect(result.version).toBe(1);
  });

  it("push v2 with different data", async () => {
    const result = await pushConfigApi(CONFIG_NAME, "claude", { claude_md: "# Version 2" });
    expect(result.version).toBe(2);
  });

  it("list versions shows v1 and v2", async () => {
    const versions = await getConfigVersions(configId);
    expect(versions.length).toBe(2);

    const v1 = versions.find((v) => v.version === 1);
    const v2 = versions.find((v) => v.version === 2);
    expect(v1).toBeTruthy();
    expect(v2).toBeTruthy();
    expect(v2!.isCurrent).toBe(true);
    expect(v1!.isCurrent).toBe(false);
  });

  it("rollback to v1", async () => {
    const versions = await getConfigVersions(configId);
    const v1 = versions.find((v) => v.version === 1)!;

    await rollbackConfig(configId, v1.id);

    // Verify current version is now v1
    const pulled = await pullConfigApi(CONFIG_NAME, "claude");
    expect(pulled.data).toBeTruthy();
  });

  it("versions after rollback show v1 as current", async () => {
    const versions = await getConfigVersions(configId);
    const v1 = versions.find((v) => v.version === 1);
    expect(v1!.isCurrent).toBe(true);
  });
});
