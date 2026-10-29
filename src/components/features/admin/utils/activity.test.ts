import { describe, expect, it } from "vitest";
import { USERS_COPY } from "../copy";
import { describeActivity } from "./activity";

const now = new Date("2026-10-29T12:00:00Z");

describe("describeActivity", () => {
  it("words a role change with who made it", () => {
    const item = describeActivity(
      { id: "1", kind: "role_changed", at: "2026-10-29T11:50:00Z", detail: { from: "member", to: "admin", by: "Nour Haddad" } },
      USERS_COPY.en,
      "en",
      now
    );
    expect(item).toMatchObject({ title: "Role changed from Member to Admin", meta: "By Nour Haddad", time: "10m", tone: "warning" });
  });

  it("names a sign-in's device and address", () => {
    const item = describeActivity(
      { id: "2", kind: "signed_in", at: "2026-10-27T12:00:00Z", detail: { browser: "Chrome", os: "macOS", ip: "10.0.0.1" } },
      USERS_COPY.en,
      "en",
      now
    );
    expect(item.meta).toBe("Chrome on macOS · 10.0.0.1");
    expect(item.time).toBe("2d");
  });

  it("speaks Arabic", () => {
    const item = describeActivity({ id: "3", kind: "deactivated", at: "2026-10-29T11:00:00Z", detail: { by: "نور" } }, USERS_COPY.ar, "ar", now);
    expect(item).toMatchObject({ title: "تم التعطيل", meta: "بواسطة نور", time: "1س" });
  });
});
