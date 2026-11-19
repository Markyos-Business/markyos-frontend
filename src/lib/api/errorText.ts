import { ApiError } from "./client";
import type { Lang } from "@/types/lang";
import { plural } from "@/lib/i18n/plural";

/**
 * What to tell someone when an action fails, in their language.
 *
 * The backend answers in English only (no LocaleMiddleware, no Arabic
 * catalogue), so its text can't be shown as-is in the Arabic interface. Until
 * it sends error codes, the kind of failure decides the message: offline,
 * rate-limited, signed out, no access, gone, changed elsewhere, server fault.
 * A validation message from the server is shown only when it is written in
 * the reader's language; otherwise the caller's fallback (or a generic line)
 * stands in.
 *
 * Never put `err.message` on screen directly; pass the error here
 * (`errorText` from "@/lib/api/errorText").
 */
type Copy = { en: string; ar: string };

const COPY = {
  offline: { en: "Can't reach Markyos. Check your connection and try again.", ar: "تعذّر الاتصال بماركيوس. تحقّق من اتصالك وحاول مرة أخرى." },
  signedOut: { en: "Your session has ended. Sign in again.", ar: "انتهت جلستك. سجّل الدخول مرة أخرى." },
  forbidden: { en: "You don't have access to do this.", ar: "ليست لديك صلاحية لتنفيذ هذا الإجراء." },
  notFound: { en: "This no longer exists. It may have been deleted.", ar: "لم يعد هذا العنصر موجودًا. ربما حُذف." },
  conflict: { en: "This changed while you were working on it. Reload to see the latest version.", ar: "تغيّر هذا العنصر أثناء عملك عليه. أعد تحميل الصفحة لعرض أحدث نسخة." },
  tooLarge: { en: "That file is too large.", ar: "حجم الملف أكبر من المسموح." },
  server: { en: "Something went wrong on our side. Try again in a moment.", ar: "حدث خطأ من جهتنا. حاول مرة أخرى بعد قليل." },
  invalid: { en: "That couldn't be saved. Check what you entered and try again.", ar: "تعذّر الحفظ. راجع ما أدخلته وحاول مرة أخرى." },
  generic: { en: "Something went wrong. Try again.", ar: "حدث خطأ. حاول مرة أخرى." },
} satisfies Record<string, Copy>;

const ARABIC = /[؀-ۿ]/;

/** Whether `text` is written in `lang`: any Arabic letter means Arabic. */
const isWrittenIn = (text: string, lang: Lang) => ARABIC.test(text) === (lang === "ar");

const tooManyAttempts = (seconds: number | null, lang: Lang): string => {
  if (seconds === null) return lang === "ar" ? "محاولات كثيرة. حاول مرة أخرى بعد قليل." : "Too many attempts. Try again shortly.";
  const minutes = Math.ceil(seconds / 60);
  if (lang === "ar") {
    const wait = seconds < 90
      ? plural("ar", seconds, { one: "ثانية واحدة", two: "ثانيتين", few: "{n} ثوانٍ", other: "{n} ثانية" })
      : plural("ar", minutes, { one: "دقيقة واحدة", two: "دقيقتين", few: "{n} دقائق", other: "{n} دقيقة" });
    return `محاولات كثيرة. حاول مرة أخرى بعد ${wait}.`;
  }
  const wait = seconds < 90
    ? plural("en", seconds, { one: "{n} second", other: "{n} seconds" })
    : plural("en", minutes, { one: "{n} minute", other: "{n} minutes" });
  return `Too many attempts. Try again in ${wait}.`;
};

/**
 * @param fallback What to say when the server's own words can't be used:
 *   the action-specific line ("Couldn't save the brand.") beats the generic one.
 */
const errorText = (err: unknown, lang: Lang, fallback?: Copy): string => {
  const pick = (copy: Copy) => copy[lang];
  const otherwise = fallback ?? COPY.generic;
  if (!(err instanceof ApiError)) {
    // A frontend-thrown Error is shown only when it already speaks the reader's language.
    const message = err instanceof Error ? err.message : "";
    return message && isWrittenIn(message, lang) && fallback === undefined ? message : pick(otherwise);
  }
  switch (true) {
    case err.status === 0: return pick(COPY.offline);
    case err.status === 429: return tooManyAttempts(err.retryAfterSeconds, lang);
    case err.status === 401: return pick(COPY.signedOut);
    case err.status === 403: return pick(COPY.forbidden);
    case err.status === 404: return pick(COPY.notFound);
    case err.status === 409 || err.status === 412: return pick(COPY.conflict);
    case err.status === 413: return pick(COPY.tooLarge);
    case err.status >= 500: return pick(COPY.server);
    default:
      if (err.message && isWrittenIn(err.message, lang)) return err.message;
      return pick(fallback ?? COPY.invalid);
  }
};

/**
 * Per-field server messages for a form, kept only when they are in the
 * reader's language; the form's own validation copy covers the rest.
 */
const fieldErrors = (err: unknown, lang: Lang): Record<string, string> => {
  if (!(err instanceof ApiError)) return {};
  return Object.fromEntries(Object.entries(err.fields).filter(([, message]) => isWrittenIn(message, lang)));
};

export { errorText, fieldErrors, isWrittenIn };
