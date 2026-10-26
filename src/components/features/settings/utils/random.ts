/** A short throwaway password for the client link. */
export function randomPassword(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** A demo API key in the shape the real ones will have. */
export function randomApiKey(): string {
  return "mk_test_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
