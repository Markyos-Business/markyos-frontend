"use client";

import { ContentCard, KeyValueList, StatCard, StatGrid } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/useAdminLang";
import type { AdminUser } from "../../types";
import { formatDate, relativeTime } from "../../utils/format";
import { UserBrands } from "./UserBrands";

type OverviewTabProps = { user: AdminUser; sessionCount: number | null };

/** The account at a glance: counts, its details, and its brands. */
export function OverviewTab({ user, sessionCount }: OverviewTabProps) {
  const { c, lang } = useAdminLang();
  const d = c.detail;
  return (
    <div className="flex flex-col gap-5">
      <StatGrid className="xl:grid-cols-3">
        <StatCard label={d.brandsOwned} value={user.brandsOwned} footnote={d.ownedFootnote} />
        <StatCard label={d.brandsMember} value={user.brandsMember} footnote={d.memberFootnote} />
        <StatCard label={d.sessions} value={sessionCount ?? "—"} footnote={d.sessionsFootnote} loading={sessionCount === null} />
      </StatGrid>

      <ContentCard title={d.details}>
        <KeyValueList
          layout="grid"
          items={[
            { label: d.email, value: <span dir="ltr">{user.email}</span> },
            { label: d.type, value: c.types[user.accountType ?? "none"] },
            { label: d.language, value: user.language ? <span dir="ltr">{c.locales[user.language]}</span> : c.filters.followsBrand },
            { label: d.joined, value: formatDate(user.createdAt, lang) },
            {
              label: d.lastSignedIn,
              value: user.lastLoginAt ? `${relativeTime(user.lastLoginAt, lang)} · ${formatDate(user.lastLoginAt, lang)}` : c.table.never,
            },
            { label: d.twoFactor, value: user.twoFactorEnabled ? d.on : d.off },
          ]}
        />
      </ContentCard>

      <UserBrands userId={user.id} />
    </div>
  );
}
