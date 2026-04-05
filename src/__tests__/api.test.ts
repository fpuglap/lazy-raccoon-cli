import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMe, pushConfig } from "../lib/api.js";

describe("API resilience and validation", () => {
  const mockCreds = {
    token: "test-token",
    email: "test@example.com",
    api_url: "http://localhost:3000",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("AbortSignal", { timeout: vi.fn() });
    
    // Mock setTimeout for faster tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should retry on 5xx errors and succeed", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    
    // Attempt 1: 500 error
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error" })
    });
    
    // Attempt 2: Success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ email: "test@example.com", username: "tester" })
    });

    const promise = getMe(mockCreds);
    
    // Fast forward the backoff timeout
    await vi.runAllTimersAsync();
    
    const result = await promise;
    expect(result.email).toBe("test@example.com");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should throw an error after all retries are exhausted", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: "Service Unavailable" })
    });

    const promise = getMe(mockCreds);
    const expectPromise = expect(promise).rejects.toThrow("Service Unavailable");
    
    await vi.runAllTimersAsync();

    await expectPromise;
    expect(fetchMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should break early and not retry on 400 Bad Request", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Bad request" })
    });

    const promise = getMe(mockCreds);
    const expectPromise = expect(promise).rejects.toThrow("Bad request");
    
    await vi.runAllTimersAsync();
    
    await expectPromise;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should throw Zod error when API response does not match the schema", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        // Missing "version" -> invalid ConfigResponse
        id: "123",
        name: "test-config"
      })
    });

    const promise = pushConfig(mockCreds, "test-config", "claude", {}, "team-1");
    
    await expect(promise).rejects.toThrow(/version/);
  });
});
