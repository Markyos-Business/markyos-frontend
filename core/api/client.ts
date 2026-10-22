/**
 * The one HTTP client for the Markyos backend.
 *
 * Off unless `NEXT_PUBLIC_API_URL` is set. Until the brands themselves are
 * stored on the server, the browser-only build keeps working exactly as it did
 * — the demo login, the seed brands and the browser sweeps all depend on it —
 * and pointing this at the API is an opt-in per environment.
 *
 * Tokens: the access token is held in this module's memory and nowhere else,
 * so an injected script has nothing in storage to read. The refresh token is
 * an httpOnly cookie the browser sends to the auth endpoints by itself; this
 * code never sees it. A reload therefore starts with no access token, and
 * `refreshSession()` swaps the cookie for a new one.
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
export const API_ENABLED = API_URL !== "";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/*
 * Called when the server ends a session the app still thinks is live: the
 * refresh token expired, was revoked by a password reset elsewhere, or was
 * blacklisted by a logout in another tab. The store registers a handler that
 * signs the person out, so the UI says "signed out" once instead of every
 * request failing on its own.
 */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Per-field messages from a 400, keyed by field name. */
    readonly fields: Record<string, string> = {},
    /** The parsed response body, for callers that need more than a message
     *  (a 409 carries the server's current copy). */
    readonly data: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Django REST Framework answers `{ detail }`, or `{ field: [messages] }`. */
function toApiError(status: number, data: unknown, retryAfter?: string | null): ApiError {
  if (status === 429) {
    const seconds = Number(retryAfter);
    const wait =
      Number.isFinite(seconds) && seconds > 0
        ? seconds < 90
          ? `${Math.ceil(seconds)} seconds`
          : `${Math.ceil(seconds / 60)} minutes`
        : "a minute";
    return new ApiError(`Too many attempts. Try again in ${wait}.`, 429);
  }
  const fields: Record<string, string> = {};
  let detail: string | null = null;
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first !== "string") continue;
      if (key === "detail" || key === "non_field_errors" || key === "error") detail ??= first;
      else fields[key] = first;
    }
  }
  const message = detail ?? Object.values(fields)[0] ?? "Something went wrong. Try again.";
  return new ApiError(message, status, fields, data);
}

/*
 * One refresh at a time. Several requests can find the access token expired
 * at once; without this each would rotate the refresh cookie, and every
 * rotation after the first presents a token the server has just blacklisted.
 */
let refreshing: Promise<boolean> | null = null;

/** Swap the refresh cookie for a new access token. False when not signed in. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        accessToken = null;
        return false;
      }
      accessToken = ((await res.json()) as { access: string }).access;
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-encoded, except a `FormData`, which goes as multipart. */
  body?: unknown;
}

/**
 * Call the API. Resolves to the parsed JSON (undefined for a 204), or throws
 * an `ApiError` whose message is fit to show the person.
 *
 * A 401 on an authenticated call gets one refresh and one retry, so a
 * fifteen-minute access token expiring mid-session is invisible.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const json = options.body !== undefined && !(options.body instanceof FormData);
  const send = () =>
    fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        // A FormData body sets its own multipart boundary.
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: json ? JSON.stringify(options.body) : (options.body as FormData | undefined),
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && accessToken) {
      if (await refreshSession()) res = await send();
      else onSessionExpired?.();
    }
  } catch {
    throw new ApiError("Can't reach the Markyos server. Check your connection and try again.", 0);
  }

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw toApiError(res.status, data, res.headers.get("Retry-After"));
  return data as T;
}
