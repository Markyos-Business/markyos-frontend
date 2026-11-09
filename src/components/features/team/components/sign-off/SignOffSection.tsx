"use client";

import { useApp } from "@/contexts/AppContext";
import { useEffect, useState } from "react";
import { API_ENABLED } from "@/lib/api/client";
import { Badge, Button, EmptyHint, Icon, Section, useToast } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";

/**
 * Client sign-off. Clients leave these on the published guideline, section by
 * section. Resolving them belongs here rather than on the guideline itself:
 * the client should not be able to close their own note.
 */
export function SignOffSection({ ws, canGovern, isAr }: { ws: Workspace; canGovern: boolean; isAr: boolean }) {
  const { resolveSignOffPin, refreshSignOffPins } = useApp();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(API_ENABLED);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!API_ENABLED) return;
    let canceled = false;
    void refreshSignOffPins(ws.id).then(
      () => { if (!canceled) { setLoading(false); setError(null); } },
      () => { if (!canceled) { setLoading(false); setError(isAr ? "تعذّر تحميل الملاحظات. حاول التحديث مجددًا." : "Notes could not be loaded. Try refreshing again."); } },
    );
    return () => { canceled = true; };
  }, [ws.id, refresh, refreshSignOffPins, isAr]);

  async function resolve(pinId: string) {
    setPending(pinId);
    setError(null);
    try {
      await resolveSignOffPin(ws.id, pinId);
      showToast(isAr ? "تمت معالجة الملاحظة." : "Marked as handled.", "success");
    } catch {
      setError(isAr ? "تعذّر تحديث الملاحظة. لم يتم تأكيد معالجتها." : "The note could not be updated. It has not been marked as handled.");
    } finally { setPending(null); }
  }
  const openPins = ws.signOffPins.filter((p) => !p.resolved);
  const pins = [...ws.signOffPins].sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.createdAt - a.createdAt);

  return (
    <Section
      title={isAr ? "اعتماد العميل" : "Client sign-off"}
      icon="map-marker"
      right={<div className="flex items-center gap-2">{openPins.length > 0 && <span className="text-[12px] text-text-muted">{openPins.length} {isAr ? "مفتوحة" : "open"}</span>}{API_ENABLED && <Button variant="link" size="sm" disabled={loading} onClick={() => { setLoading(true); setRefresh((n) => n + 1); }}>{loading ? (isAr ? "جارٍ التحميل…" : "Loading…") : (isAr ? "تحديث الملاحظات" : "Refresh notes")}</Button>}</div>}
    >
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      {pins.length === 0 ? (
        <EmptyHint>{loading ? (isAr ? "جارٍ تحميل ملاحظات العميل…" : "Loading client notes…") : (isAr ? "لا توجد ملاحظات بعد. تظهر هنا ملاحظات العميل على الدليل المنشور." : "Nothing yet. Clients leave notes on each section of the published guideline, and they land here.")}</EmptyHint>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pins.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-card bg-surface-2 p-3.5 shadow-edge">
              <Icon name={p.resolved ? "check-circle" : "map-marker"} size={14} className={`mt-0.5 shrink-0 ${p.resolved ? "text-success" : "text-warning"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="auto" className="bidi-auto text-[13px] font-semibold">
                    {p.authorName}
                  </span>
                  <Badge tone="neutral">{p.section}</Badge>
                  <span className="text-[11.5px] text-text-faint">{formatRelative(p.createdAt)}</span>
                </div>
                <p dir="auto" className="bidi-auto mt-1 text-[13px] leading-[1.6] text-text-secondary">
                  {p.note}
                </p>
              </div>
              {!p.resolved && canGovern && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending !== null}
                  onClick={() => void resolve(p.id)}
                >
                  {pending === p.id ? (isAr ? "جارٍ الحفظ…" : "Saving…") : (isAr ? "تمت المعالجة" : "Mark handled")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
