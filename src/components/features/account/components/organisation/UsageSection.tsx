"use client";

import { Section, StatTile } from "@/components/ui";
import type { AccountPageState } from "../../hooks/useAccountPage";
import { useAccountLang } from "../../hooks/shared/useAccountLang";

/** What the account's brands hold, in numbers, and how full each brand is. */
export function UsageSection({ stats, richness }: AccountPageState["usage"]) {
  const { t } = useAccountLang();
  return (
    <Section title={t("Usage analytics", "تحليلات الاستخدام")} icon="chart-line">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-4">
        <StatTile value={stats.workspaces} label={t("Workspaces", "مساحات العمل")} />
        <StatTile value={stats.shared} label={t("Shared with clients", "مشاركة مع العملاء")} />
        <StatTile value={stats.colors} label={t("Colors defined", "ألوان معرّفة")} />
        <StatTile value={stats.logos} label={t("Logo files", "ملفات الشعار")} />
        <StatTile value={stats.signOffs} label={t("Sign-off notes", "ملاحظات الاعتماد")} />
        <StatTile value={stats.approvals} label={t("Change proposals", "مقترحات التغيير")} />
      </div>
      <div className="flex flex-col gap-space-3">
        <span className="text-caption text-text-muted">{t("Content richness by brand", "ثراء المحتوى حسب العلامة")}</span>
        {richness.map((w) => (
          <div key={w.id} className="flex items-center gap-space-4">
            <span dir="auto" className="bidi-auto text-caption font-medium w-35 truncate shrink-0">{w.name}</span>
            {/* The spec's progress bar: a 6px track on the neutral tint. */}
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-ink-soft">
              <div className="h-full rounded-full bg-accent" style={{ width: `${w.share * 100}%` }} />
            </div>
            <span className="text-caption font-medium tabular-nums w-6 text-end text-text-muted">{w.value}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
