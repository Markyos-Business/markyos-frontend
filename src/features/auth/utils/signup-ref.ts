/**
 * Sign-up attribution: where an account came from (ref=badge, and the page
 * type it was on). The badge's link carries `?ref=badge&type=form`; it's kept
 * in a first-party cookie for 30 days, so a visitor who signs up later still
 * counts, and sent with the sign-up, which stores it on the new account.
 */

const COOKIE = "mk_signup_ref";
const THIRTY_DAYS = 30 * 24 * 60 * 60;
const REF = /^[a-z0-9_-]{1,32}$/;
const PAGE_TYPES = ["form", "moodboard", "guide", "other"] as const;

type SignupRef = { ref: string; refType?: (typeof PAGE_TYPES)[number] };

/** Keeps `?ref=` (and its `type`) from the sign-up link. A link without ref changes nothing. */
function captureSignupRef(params: URLSearchParams) {
  const ref = params.get("ref");
  if (!ref || !REF.test(ref)) return;
  const type = params.get("type");
  const value: SignupRef = { ref, ...(PAGE_TYPES.includes(type as SignupRef["refType"] & string) ? { refType: type as SignupRef["refType"] } : {}) };
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${THIRTY_DAYS}; Path=/; SameSite=Lax`;
}

/** What to send with a sign-up: `{ ref, refType }`, or nothing. */
function signupRefBody(): Partial<SignupRef> {
  if (typeof document === "undefined") return {};
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return {};
  try {
    const value = JSON.parse(decodeURIComponent(raw.slice(COOKIE.length + 1))) as SignupRef;
    return REF.test(value.ref) ? { ref: value.ref, ...(value.refType ? { refType: value.refType } : {}) } : {};
  } catch {
    return {};
  }
}

/** Once an account exists, the attribution has done its job. */
function clearSignupRef() {
  if (typeof document !== "undefined") document.cookie = `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export { captureSignupRef, clearSignupRef, signupRefBody };
