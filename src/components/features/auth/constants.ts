/** Good enough to catch typos; the server has the final say. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Resets expire, because a token that works forever is not a reset. */
export const RESET_TTL_MS = 30 * 60 * 1000;

/**
 * The Google Cloud OAuth client this build signs in with (same id as the
 * backend's GOOGLE_CLIENT_ID). Unset keeps "Continue with Google" switched off.
 */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
