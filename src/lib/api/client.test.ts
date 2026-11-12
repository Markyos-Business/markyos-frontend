import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, setAccessToken } from "./client";

beforeEach(() => { setAccessToken(null); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => vi.unstubAllGlobals());

function response(status: number, data: unknown, headers: Record<string, string> = {}) {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(data), { status, headers }));
}

describe("API failure metadata", () => {
  it("preserves Retry-After, response data and request ID through the thrown error", async () => {
    const data = { detail: "Request was throttled.", code: "example" };
    response(429, data, { "Retry-After": "45", "X-Request-ID": "audit-request" });
    await expect(api("/auth/login/", { method: "POST" })).rejects.toMatchObject({
      status: 429, retryAfterSeconds: 45, data, requestId: "audit-request",
    });
  });

  it.each(["", "0", "-2", "not-a-delay", "Infinity"])("does not invent a delay for %s", async (retry) => {
    response(429, {}, { "Retry-After": retry });
    await expect(api("/auth/login/")).rejects.toMatchObject({ retryAfterSeconds: null, message: "Too many attempts. Try again shortly." });
  });

  it("rounds a positive fractional delay up", async () => {
    response(429, {}, { "Retry-After": "1.2" });
    await expect(api("/auth/login/")).rejects.toMatchObject({ retryAfterSeconds: 2 });
  });

  it("keeps existing field errors and correlation metadata intact", async () => {
    const data = { email: ["Enter a valid email address."] };
    response(400, data, { "X-Request-ID": "validation-request" });
    await expect(api("/auth/login/")).rejects.toMatchObject({ status: 400, fields: { email: data.email[0] }, data, requestId: "validation-request", retryAfterSeconds: null });
  });

  it("retains a typed network failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Network offline"));
    await expect(api("/auth/login/")).rejects.toBeInstanceOf(ApiError);
  });
});
