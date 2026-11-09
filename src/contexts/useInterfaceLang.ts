"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useApp, useCurrentAccount } from "./AppContext";
import {
  applyDocumentLang,
  readGuestLang,
  resolveLang,
  subscribeGuestLang,
  writeGuestLang,
} from "@/lib/i18n/interfaceLang";
import type { Lang } from "@/types/lang";

/**
 * The language the person reads Markyos in, outside a brand: the sign-in
 * screens, the studio pages, account settings, the admin panel.
 *
 * The account's own choice wins; before sign-in (or if they never chose) it is
 * this browser's choice, then Arabic. Changing it saves to both, so the next
 * sign-in and the next visit open in the same language.
 */
export function useInterfaceLang() {
  const account = useCurrentAccount();
  const { state, setAdminLang } = useApp();
  const guest = useSyncExternalStore(subscribeGuestLang, readGuestLang, () => null);
  // False only while hydrating, when the server's default stands in for this
  // browser's choice; nothing should act on the language until it is true.
  const settled = useSyncExternalStore(noop, () => true, () => false);
  const lang = resolveLang(account?.adminLang, guest);

  const setLang = useCallback(
    (next: Lang) => {
      writeGuestLang(next);
      if (state.session) setAdminLang(next);
    },
    [state.session, setAdminLang]
  );

  return { lang, isAr: lang === "ar", setLang, settled } as const;
}

const noop = () => () => {};

/**
 * Points <html> at `lang` while the calling screen is shown. Toasts and
 * dialogs render at the document root and read their direction from there.
 * Waits for `settled`, so the hydration pass doesn't flip an English page to
 * Arabic and back.
 */
export function useDocumentLang(lang: Lang, settled = true) {
  useEffect(() => {
    if (settled) applyDocumentLang(lang);
  }, [lang, settled]);
}

/**
 * An account that never picked a language takes the one this browser was
 * using (from the website's `?lang=` link or the sign-in screen's switch) the
 * first time it signs in, so the choice made before signing in carries over.
 */
export function useAdoptGuestLang() {
  const account = useCurrentAccount();
  const { setAdminLang } = useApp();
  useEffect(() => {
    if (!account) return;
    // The account's own choice is what this browser opens in next time, too.
    if (account.adminLang) {
      if (readGuestLang() !== account.adminLang) writeGuestLang(account.adminLang);
      return;
    }
    const guest = readGuestLang();
    if (guest) setAdminLang(guest);
  }, [account, setAdminLang]);
}
