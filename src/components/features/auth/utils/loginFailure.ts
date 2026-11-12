import { ApiError } from "@/lib/api/client";
import type { AuthCopy } from "../copy";
import type { LoginFailure } from "../types";

/** Preserve the failure of the credential request, distinct from later account/data reads. */
export class LoginFailureError extends Error {
  constructor(readonly failure: LoginFailure, cause: unknown) {
    super(cause instanceof Error ? cause.message : "Sign-in failed.", { cause });
    this.name = "LoginFailureError";
  }
}

/** HTTP status is stable; backend prose is not a translation key. */
export function classifyLoginFailure(error: unknown, credentialRequest = false): LoginFailure {
  if (error instanceof LoginFailureError) return error.failure;
  if (error instanceof ApiError) {
    if (error.status === 0) return { kind: "network" };
    if (error.status === 401 && credentialRequest) return { kind: "invalidCredentials" };
    if (error.status === 429) return {
      kind: "rateLimited",
      ...(error.retryAfterSeconds !== null ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
    };
    if (error.status >= 500) return { kind: "unavailable" };
  }
  return { kind: "unexpected" };
}

/** Resolve at render time so an error follows the current interface language. */
export function loginFailureMessage(failure: LoginFailure, copy: AuthCopy["errors"]): string {
  switch (failure.kind) {
    case "invalidCredentials": return copy.loginCredentials;
    case "network": return copy.loginNetwork;
    case "unavailable": return copy.loginUnavailable;
    case "rateLimited": return failure.retryAfterSeconds !== undefined && Number.isFinite(failure.retryAfterSeconds) && failure.retryAfterSeconds > 0
      ? copy.loginRetryAfter(Math.ceil(failure.retryAfterSeconds))
      : copy.loginRateLimited;
    default: return copy.loginFailed;
  }
}
