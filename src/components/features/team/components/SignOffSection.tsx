"use client";

import { useApp } from "@/contexts/AppContext";
import { Badge, Button, EmptyHint, Icon, Section, useToast } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Workspace } from "@/types";

/**
 * Client sign-off. Clients leave these on the published guideline, section by
 * section. Resolving them belongs here rather than on the guideline itself:
 * the client should not be able to close their own note.
 */
export function SignOffSection({ ws, canGovern }: { ws: Workspace; canGovern: boolean }) {
  const { resolveSignOffPin } = useApp();
  const { showToast } = useToast();
  const openPins = ws.signOffPins.filter((p) => !p.resolved);
  const pins = [...ws.signOffPins].sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.createdAt - a.createdAt);

  return (
    <Section
      title="Client sign-off"
      icon="map-marker"
      right={openPins.length > 0 ? <span className="text-[12px] text-text-muted">{openPins.length} open</span> : undefined}
    >
      {pins.length === 0 ? (
        <EmptyHint>Nothing yet. Clients leave notes on each section of the published guideline, and they land here.</EmptyHint>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pins.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-xl bg-surface-2 p-3.5 shadow-edge">
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
                  onClick={() => {
                    resolveSignOffPin(ws.id, p.id);
                    showToast("Marked as handled.", "success");
                  }}
                >
                  Mark handled
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
