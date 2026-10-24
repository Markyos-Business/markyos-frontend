"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon, Button } from "@/components/ui";
import { ShareScope, Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";

/**
 * Read-only links to this brand's thinking.
 *
 * Deliberately separate from the client guideline link. That one is the
 * finished book, behind a plan and a password; these are for the middle of the
 * work — a new hire who needs the strategy, a department head who needs their
 * own page and nothing else. They carry no editor and no route back into the
 * app, and they can be switched off without deleting anything.
 *
 * Mounted on Strategy (scope "strategy") and on each department
 * (scope "department"), so a link is created where the thing it points at is.
 */
export function ShareLinksPanel({
  ws,
  scope,
  departmentId,
  isAr,
}: {
  ws: Workspace;
  scope: ShareScope;
  /** Required when scope is "department". */
  departmentId?: string;
  isAr: boolean;
}) {
  const { createShareLink, revokeShareLink, restoreShareLink } = useApp();
  const { showToast } = useToast();
  const [origin, setOrigin] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The browser's origin isn't derivable from React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const links = ws.shareLinks.filter((l) =>
    scope === "department" ? l.scope === "department" && l.departmentId === departmentId : l.scope === "strategy"
  );
  const live = links.filter((l) => !l.revokedAt);

  function urlFor(token: string) {
    return origin ? `${origin}/s/${token}` : `/s/${token}`;
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      showToast(isAr ? "تم نسخ الرابط." : "Link copied.", "success");
    } catch {
      // The value is on screen and selectable, so this is a convenience that
      // failed rather than a loss.
      showToast(
        isAr ? "المتصفح منع النسخ — الرابط ظاهر للتحديد." : "The browser blocked copying — the link is on screen to select.",
        "danger"
      );
    }
  }

  function handleCreate() {
    const token = createShareLink(ws.id, scope, departmentId);
    setOpen(true);
    void copy(token);
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--surface-1)" }}>
      <div className="flex items-center gap-2.5">
        <Icon name="link" size={15} style={{ color: "var(--accent-text)" }} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold">
            {scope === "department"
              ? isAr ? "مشاركة هذا القسم" : "Share this department"
              : isAr ? "مشاركة الاستراتيجية" : "Share the strategy"}
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>
            {scope === "department"
              ? isAr
                ? "رابط للقراءة فقط يعرض تعليمات هذا القسم وحده."
                : "A read-only link showing this department's instructions and nothing else."
              : isAr
                ? "رابط للقراءة فقط يعرض الاستراتيجية كاملة — بلا محرر وبلا بقية المنصة."
                : "A read-only link to the full strategy — no editor, no rest of the app."}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCreate}>
          {isAr ? "إنشاء رابط" : "Create link"}
        </Button>
      </div>

      {links.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mk-tap gap-1.5 text-[11.5px] font-semibold cursor-pointer self-start"
            style={{ color: "var(--text-muted)" }}
          >
            <Icon name={open ? "angle-up" : "angle-down"} size={11} />
            {isAr
              ? `${live.length} رابط نشط من ${links.length}`
              : `${live.length} active of ${links.length} link${links.length === 1 ? "" : "s"}`}
          </button>

          {open && (
            <div className="flex flex-col gap-2">
              {links.map((l) => {
                const revoked = !!l.revokedAt;
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{ background: "var(--surface-2)", opacity: revoked ? 0.6 : 1 }}
                  >
                    <span
                      dir="ltr"
                      className="flex-1 min-w-0 truncate text-[11.5px]"
                      style={{
                        fontFamily: "ui-monospace, Menlo, monospace",
                        color: "var(--text-secondary)",
                        textDecoration: revoked ? "line-through" : undefined,
                      }}
                    >
                      {urlFor(l.id)}
                    </span>
                    <span className="text-[10.5px] shrink-0" style={{ color: "var(--text-faint)" }}>
                      {revoked
                        ? isAr ? `أُوقف ${formatRelative(l.revokedAt!)}` : `off ${formatRelative(l.revokedAt!)}`
                        : formatRelative(l.createdAt)}
                    </span>
                    {!revoked && (
                      <button
                        type="button"
                        onClick={() => copy(l.id)}
                        className="text-[11.5px] font-semibold cursor-pointer shrink-0"
                        style={{ color: "var(--accent-text)" }}
                      >
                        {isAr ? "نسخ" : "Copy"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (revoked) {
                          restoreShareLink(ws.id, l.id);
                          showToast(isAr ? "أُعيد تفعيل الرابط." : "Link switched back on.", "success");
                        } else {
                          revokeShareLink(ws.id, l.id);
                          showToast(
                            isAr ? "تم إيقاف الرابط — لم يعد يفتح شيئًا." : "Link switched off — it opens nothing now.",
                            "success"
                          );
                        }
                      }}
                      className="text-[11.5px] font-semibold cursor-pointer shrink-0"
                      style={{ color: revoked ? "var(--text-muted)" : "var(--danger)" }}
                    >
                      {revoked ? (isAr ? "إعادة التفعيل" : "Restore") : isAr ? "إيقاف" : "Revoke"}
                    </button>
                  </div>
                );
              })}
              {/* Said rather than discovered: this build keeps everything in the
                  browser it was made in, so a link only opens for someone
                  sharing that browser. */}
              <p className="text-[11px] leading-[1.5]" style={{ color: "var(--text-faint)" }}>
                {isAr
                  ? "تُحفظ بيانات هذا الإصدار في هذا المتصفح، لذا يفتح الرابط من هذا المتصفح فقط."
                  : "This build keeps its data in this browser, so a link opens for anyone using this browser — not yet across devices."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
