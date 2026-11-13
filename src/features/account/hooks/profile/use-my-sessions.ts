"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { API_ENABLED } from "@/lib/api/client";
import { endMySession, listMySessions, signOutOtherSessions } from "../../api/account.api";
import type { MySession } from "../../types";
import { useAccountLang } from "../shared/use-account-lang";

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Where you're signed in, and signing other browsers out. */
export function useMySessions() {
  const { t, isAr } = useAccountLang();
  const [version, setVersion] = useState(0);
  // The browser-only build has no server sessions to list.
  const sessions = useRequest(() => (API_ENABLED ? listMySessions() : Promise.resolve([])), `my-sessions:${version}`);
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const reload = () => setVersion((v) => v + 1);

  const deviceName = (s: MySession) =>
    s.browser && s.os ? (isAr ? `${s.browser} على ${s.os}` : `${s.browser} on ${s.os}`) : s.browser ?? s.os ?? t("Unknown browser", "متصفح غير معروف");

  async function signOut(session: MySession) {
    const ok = await confirm({
      title: isAr ? `تسجيل الخروج من ${deviceName(session)}؟` : `Sign out of ${deviceName(session)}?`,
      body: t("That browser has to sign in again within 15 minutes.", "على ذلك المتصفح تسجيل الدخول مجددًا خلال 15 دقيقة."),
      confirmLabel: t("Sign out", "تسجيل الخروج"),
      isAr,
      tone: "danger",
    });
    if (!ok) return;
    try {
      await endMySession(session.id);
      showToast(t("Signed out of that browser.", "سُجّل الخروج من ذلك المتصفح."), "success");
      reload();
    } catch (err) {
      showToast(message(err), "danger");
    }
  }

  async function signOutOthers() {
    const ok = await confirm({
      title: t("Sign out of every other browser?", "تسجيل الخروج من كل المتصفحات الأخرى؟"),
      body: t("They each have to sign in again within 15 minutes. This browser stays signed in.", "على كل منها تسجيل الدخول مجددًا خلال 15 دقيقة، ويبقى هذا المتصفح مسجّلًا."),
      confirmLabel: t("Sign out others", "تسجيل خروج الآخرين"),
      isAr,
      tone: "danger",
    });
    if (!ok) return;
    try {
      const { signedOut } = await signOutOtherSessions();
      showToast(isAr ? `سُجّل الخروج من ${signedOut} ${signedOut === 1 ? "متصفح آخر" : "متصفحات أخرى"}.` : signedOut === 1 ? "Signed out of 1 other browser." : `Signed out of ${signedOut} other browsers.`, "success");
      reload();
    } catch (err) {
      showToast(message(err), "danger");
    }
  }

  const others = (sessions.data ?? []).filter((s) => !s.current).length;
  return { ...sessions, deviceName, signOut, signOutOthers, others };
}

export type MySessionsState = ReturnType<typeof useMySessions>;
