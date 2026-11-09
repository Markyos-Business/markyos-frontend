"use client";

import { Button, EmptyHint, Section } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { AccountPageState } from "../../hooks/useAccountPage";
import { useAccountLang } from "../../hooks/shared/useAccountLang";

/** The last 30 things that happened on the account, and the full log as JSON. */
export function AuditLogSection({ entries, hasEntries, onExport }: AccountPageState["audit"]) {
  const { t } = useAccountLang();
  return (
    <Section
      title={t("Audit log", "سجل التدقيق")}
      icon="shield-alt"
      right={
        hasEntries && (
          <Button variant="link" onClick={onExport} className="text-overline uppercase">
            {t("Export JSON", "تصدير JSON")}
          </Button>
        )
      }
    >
      {!hasEntries ? (
        <EmptyHint>
          {t(
            "Nothing recorded yet. This fills in as you purchase plans, verify domains, resolve approvals, restore versions, and change roles — a defensible record for regulated or public-sector brand work.",
            "لا يوجد شيء مسجّل بعد. يمتلئ مع شراء الخطط والتحقق من النطاقات وحسم الموافقات واستعادة الإصدارات وتغيير الأدوار، ليكون سجلًا موثوقًا لأعمال العلامات في القطاعات المنظَّمة والحكومية."
          )}
        </EmptyHint>
      ) : (
        <div className="flex flex-col">
          {entries.map((e, i) => (
            <div key={e.id} className={`flex items-center gap-space-4 py-space-4 text-caption ${i > 0 ? "shadow-rule-t" : ""}`}>
              <span className="w-22 shrink-0 font-medium tabular-nums text-text-muted">{formatRelative(e.ts)}</span>
              <span className="w-28 shrink-0 truncate font-medium">{e.actor}</span>
              <span className="flex-1 min-w-0 truncate text-text-secondary">{e.action}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
