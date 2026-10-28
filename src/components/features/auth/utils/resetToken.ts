import { toB64 } from "./base64";

/**
 * A one-time reset token.
 *
 * There is no mail server in this build, so this is handed to the person on
 * screen instead of being emailed. That is a genuine difference from how a
 * reset works in production and the UI says so rather than staging a fake
 * "check your inbox" screen.
 */
export function newResetToken(): string {
  const bytes = globalThis.crypto?.getRandomValues?.(new Uint8Array(9));
  if (!bytes) return Math.random().toString(36).slice(2, 14).toUpperCase();
  return toB64(bytes).replace(/[+/=]/g, "").slice(0, 12).toUpperCase();
}
