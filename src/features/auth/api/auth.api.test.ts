import { expect, it, vi } from "vitest";
import { api, setAccessToken } from "@/lib/api/client";
import { login, logout } from "./auth.api";

vi.mock("@/lib/api/client", () => ({ api: vi.fn(), setAccessToken: vi.fn(), ApiError: class extends Error {} }));

it("waits for the pending edit flush and logout before issuing a new login", async () => {
  let finishFlush!: () => void;
  const flushing = new Promise<void>((resolve) => { finishFlush = resolve; });
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/auth/login/") return { access: "new-session" };
    if (path === "/auth/me/") return { id: "new-account", name: "New", email: "new@example.com" };
    return undefined;
  });
  const signingOut = logout(() => flushing);
  const signingIn = login("new@example.com", "password");
  await Promise.resolve();
  expect(api).not.toHaveBeenCalled();
  finishFlush();
  await Promise.all([signingOut, signingIn]);
  expect(vi.mocked(api).mock.calls.map(([path]) => path)).toEqual(["/auth/logout/", "/auth/login/", "/auth/me/"]);
  expect(vi.mocked(setAccessToken).mock.calls).toEqual([[null], ["new-session"]]);
});
