"use client";

import { API_ENABLED } from "@/lib/api/client";
import { useLocalPref } from "@/hooks/useLocalPref";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { IconButton } from "@/components/ui";

/** One persistent explanation for local-only limitations, rather than page jargon. */
export function DemoNotice() {
  const { isAr } = useInterfaceLang();
  const [dismissed, dismiss] = useLocalPref("markyos:demo-explained", false);
  if (API_ENABLED || dismissed) return null;
  return <aside data-demo-notice className="flex shrink-0 items-center gap-space-4 bg-info-soft px-space-6 py-space-2 text-caption text-info">
    <span className="flex-1">{isAr ? "هذه نسخة تجريبية تحفظ التغييرات في هذا المتصفح فقط. المشاركة والدعوات والمدفوعات متاحة في التطبيق المتصل." : "This demo saves changes in this browser only. Sharing, invitations and payments are available in the connected app."}</span>
    <IconButton icon="times" label={isAr ? "إخفاء ملاحظة العرض التجريبي" : "Dismiss demo notice"} onClick={() => dismiss(true)} />
  </aside>;
}
