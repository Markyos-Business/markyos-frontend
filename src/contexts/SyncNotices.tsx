"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/**
 * Shows what the server refused as a toast.
 *
 * The store can't raise toasts itself — the toast layer sits inside it — so
 * it publishes the notice and this, rendered inside the toast layer, shows
 * each one once.
 */
export function SyncNotices() {
  const { syncNotice } = useApp();
  const { showToast } = useToast();
  const { lang } = useInterfaceLang();
  const router = useRouter();

  useEffect(() => {
    if (!syncNotice) return;
    const { action } = syncNotice;
    showToast(syncNotice.message[lang], syncNotice.tone, action ? { label: action.label[lang], run: () => router.push(action.href) } : undefined);
    // Keyed on the id: a new notice, not a re-render, is what shows a toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncNotice?.id]);

  return null;
}
