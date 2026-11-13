import type { Lang } from "@/types/lang";

/**
 * The interface language, decided in one place.
 *
 * Arabic is Markyos's first language, so it is what anyone sees until they
 * say otherwise: an account's own choice wins, then the visitor's choice in
 * this browser (from the switch, or `?lang=` on a link from the website),
 * then Arabic.
 */
export const DEFAULT_LANG: Lang = "ar";

/** Where the visitor's choice lives in this browser. Read before paint by {@link LANG_INIT_SCRIPT}. */
export const LANG_STORAGE_KEY = "markyos.lang";

export const isLang = (value: unknown): value is Lang => value === "ar" || value === "en";

/** The order every screen agrees on: the account's choice, the visitor's, then Arabic. */
export const resolveLang = (accountLang: Lang | null | undefined, guestLang: Lang | null | undefined): Lang =>
  accountLang ?? guestLang ?? DEFAULT_LANG;

/**
 * Stamps `lang` and `dir` on <html> before React hydrates, so an Arabic page
 * never flashes left-to-right first. A `?lang=` on the address (a link from the
 * website) is saved as the visitor's choice on the way.
 */
export const LANG_INIT_SCRIPT = `(function(){var k=${JSON.stringify(LANG_STORAGE_KEY)};var l=null;try{var q=new URLSearchParams(location.search).get("lang");if(q==="ar"||q==="en"){localStorage.setItem(k,q);}l=localStorage.getItem(k);}catch(e){}if(l!=="ar"&&l!=="en"){l=${JSON.stringify(DEFAULT_LANG)};}var r=document.documentElement;r.setAttribute("lang",l);r.setAttribute("dir",l==="ar"?"rtl":"ltr");})();`;

// ---- The visitor's choice: a tiny store, so changing it redraws every reader ----

const listeners = new Set<() => void>();

export function readGuestLang(): Lang | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLang(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeGuestLang(lang: Lang) {
  // An explicit choice replaces a landing link's ?lang= instead of being
  // overridden by it on every read. Native history preserves form state.
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  // Next preserves its own router state and updates useSearchParams for the
  // public native-history call; passing its internal state back skips that.
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // The URL still carries the choice when storage is blocked.
  }
  listeners.forEach((fn) => fn());
}

export function subscribeGuestLang(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Points <html> at a language: `lang` for screen readers and fonts, `dir` for layout. */
export function applyDocumentLang(lang: Lang) {
  const root = document.documentElement;
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
}
