"use client";

import { Button, Icon } from "@/components/ui";
import { useSyncStatus } from "@/contexts/useSyncStatus";

/**
 * Whether the board's changes are on the server: Saving… while a save is
 * waiting or under way, Saved once the server has answered, and Couldn't save
 * with a Retry when it hasn't. Quiet by design: muted text, no motion. Nothing
 * in the browser-only build, where there is no server to wait for.
 */
export function MoodboardSaveIndicator({ isAr }: { isAr: boolean }) {
  const { status, retry } = useSyncStatus();
  if (status === "idle") return null;
  if (status === "failed") {
    return (
      <span role="status" className="flex items-center gap-ctl-row text-caption text-danger">
        <Icon name="exclamation-circle" size={16} />
        {isAr ? "تعذّر الحفظ" : "Couldn't save"}
        <Button size="sm" variant="ghost" onClick={retry}>{isAr ? "إعادة المحاولة" : "Retry"}</Button>
      </span>
    );
  }
  const saving = status === "pending" || status === "saving";
  return (
    <span role="status" className="flex items-center gap-space-2 text-caption text-text-muted">
      <Icon name={saving ? "sync" : "check"} size={16} />
      {saving ? (isAr ? "جارٍ الحفظ…" : "Saving…") : isAr ? "تم الحفظ" : "Saved"}
    </span>
  );
}
