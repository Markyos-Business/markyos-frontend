/** Good enough to catch typos; the server has the final say. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Resets expire, because a token that works forever is not a reset. */
export const RESET_TTL_MS = 30 * 60 * 1000;
