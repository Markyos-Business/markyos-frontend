import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { AUTH_COPY } from "../copy";
import { classifyLoginFailure, LoginFailureError, loginFailureMessage } from "./loginFailure";

describe("login failures", () => {
  it.each([
    [0, "network"], [429, "rateLimited"], [500, "unavailable"], [503, "unavailable"],
    [400, "unexpected"], [403, "unexpected"], [401, "unexpected"],
  ] as const)("classifies HTTP %i without reading server prose", (status, kind) => {
    expect(classifyLoginFailure(new ApiError("Arbitrary server detail", status))).toEqual({ kind });
  });

  it("treats only a credential-request 401 as invalid credentials", () => {
    const error = new ApiError("Changed backend wording", 401);
    const failure = classifyLoginFailure(error, true);
    expect(failure).toEqual({ kind: "invalidCredentials" });
    expect(classifyLoginFailure(new LoginFailureError(failure, error))).toEqual(failure);
    // A later account/profile 401 must not incorrectly blame the password.
    expect(classifyLoginFailure(error)).toEqual({ kind: "unexpected" });
  });

  it("carries a server-provided delay without parsing its message", () => {
    expect(classifyLoginFailure(new ApiError("Anything", 429, {}, null, null, 45))).toEqual({ kind: "rateLimited", retryAfterSeconds: 45 });
  });

  it("uses a safe localized fallback for unknown failures", () => {
    const failure = classifyLoginFailure(new Error("PRIVATE_SERVER_DETAIL"));
    expect(loginFailureMessage(failure, AUTH_COPY.ar.errors)).toBe("تعذّر تسجيل الدخول. حاول مجددًا.");
    expect(loginFailureMessage(failure, AUTH_COPY.en.errors)).toBe("Sign-in didn't go through. Try again.");
  });

  it("resolves the same failure in the current language", () => {
    const failure = { kind: "invalidCredentials" } as const;
    expect(loginFailureMessage(failure, AUTH_COPY.en.errors)).toBe("That email and password don't match an account.");
    expect(loginFailureMessage(failure, AUTH_COPY.ar.errors)).toBe("بيانات تسجيل الدخول غير صحيحة. تحقّق من البريد الإلكتروني وكلمة المرور.");
  });

  it("localizes the retry duration and keeps the supplied wait", () => {
    expect(loginFailureMessage({ kind: "rateLimited", retryAfterSeconds: 45 }, AUTH_COPY.en.errors)).toContain("45 seconds");
    expect(loginFailureMessage({ kind: "rateLimited", retryAfterSeconds: 45 }, AUTH_COPY.ar.errors)).toContain("45 ثانية");
    expect(loginFailureMessage({ kind: "rateLimited", retryAfterSeconds: 125 }, AUTH_COPY.en.errors)).toContain("3 minutes");
    expect(loginFailureMessage({ kind: "rateLimited", retryAfterSeconds: 125 }, AUTH_COPY.ar.errors)).toContain("3 دقائق");
  });

  it.each([undefined, 0, -1, NaN, Infinity])("does not show an invented wait for %s", (retryAfterSeconds) => {
    const failure = { kind: "rateLimited", retryAfterSeconds } as const;
    expect(loginFailureMessage(failure, AUTH_COPY.en.errors)).toBe("Too many attempts. Try again shortly.");
    expect(loginFailureMessage(failure, AUTH_COPY.ar.errors)).toBe("محاولات كثيرة. حاول مجددًا بعد قليل.");
  });
});
