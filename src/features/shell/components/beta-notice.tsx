"use client";

import { API_ENABLED } from "@/lib/api/client";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { IconButton, MARKYOS_BETA } from "@/components/ui";

/**
 * The one notice at the top of the platform: Markyos is in beta (or, in the
 * browser-only build, a demo). Pages don't repeat it in their own words.
 *
 * Dismissal is remembered per browser. Remembering it per account would need
 * a field on the server; the separate keys mean the beta notice still shows
 * once to someone who only ever dismissed the demo one.
 */
export function BetaNotice() {
  const { isAr } = useInterfaceLang();
  const demo = !API_ENABLED;
  const [dismissed, dismiss] = useLocalPref(demo ? "markyos:demo-explained" : "markyos:beta-explained", false);
  if (dismissed || (!demo && !MARKYOS_BETA)) return null;
  const message = demo
    ? isAr
      ? "هذه نسخة تجريبية تحفظ التغييرات في هذا المتصفح فقط. المشاركة والدعوات والمدفوعات متاحة في التطبيق الكامل."
      : "This demo saves changes in this browser only. Sharing, invitations and payments are available in the full app."
    : isAr
      ? "ماركيوس في مرحلته التجريبية، لذا قد تتغير بعض الشاشات."
      : "Markyos is in beta, so some screens may still change.";
  return <aside data-beta-notice className="flex shrink-0 items-center gap-ctl-row bg-info-soft px-space-6 py-space-2 text-caption text-info">
    <span className="flex-1">{message}</span>
    <IconButton icon="times" label={isAr ? "إخفاء الملاحظة" : "Dismiss notice"} onClick={() => dismiss(true)} />
  </aside>;
}
