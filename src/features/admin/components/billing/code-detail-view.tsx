"use client";

import Link from "next/link";
import { Badge, Button, ContentCard, CopyButton, DataTable, EmptyHint, EmptyState, ErrorState, Icon, KeyValueList, Skeleton } from "@/components/ui";
import type { DataColumn, KeyValueItem } from "@/components/ui";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import type { PromoCodeDetail, PromoRedemption } from "@/features/billing";
import { errorText } from "@/lib/api/errorText";
import { usePromoActions } from "../../hooks/billing/use-promo-actions";
import { useCodeDetail } from "../../hooks/billing/use-code-detail";
import { useAdminPromoLang } from "../../hooks/shared/use-admin-lang";
import { discountLabel, shortBatch } from "../../utils/promo";
import { CodeStatusBadge } from "./code-status-badge";
import { day, money } from "./format";

const CODES_HREF = "/admin/billing?tab=codes";

/**
 * One promo code for an admin: its settings, who redeemed it and what they
 * pay now, and the audit entries. Disable the code or its whole batch, each
 * with a reason; the server records both.
 */
export function CodeDetailView({ id }: { id: string }) {
  const { p, lang } = useAdminPromoLang();
  const d = p.detail;
  const detail = useCodeDetail(id);
  const actions = usePromoActions(() => detail.request.reload());
  const back = (
    <Button variant="ghost" href={CODES_HREF} icon={<Icon name="arrow-left" size={16} />}>
      {d.back}
    </Button>
  );

  if (detail.notFound) {
    return (
      <>
        {back}
        <EmptyState icon="tag" title={d.notFound} description={d.notFoundBody} action={back} />
      </>
    );
  }
  if (!detail.code) {
    if (detail.request.failure) {
      return (
        <>
          {back}
          <ErrorState message={errorText(detail.request.failure, lang, { en: "Couldn't load this code.", ar: "تعذّر تحميل هذا الرمز." })} onRetry={detail.request.reload} />
        </>
      );
    }
    return (
      <div className="flex flex-col gap-space-5" aria-busy="true">
        {back}
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  const c = detail.code;
  return (
    <>
      <nav aria-label={d.breadcrumb}>{back}</nav>
      <ContentCard>
        <div className="flex flex-col gap-space-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-space-2">
            <h1 dir="ltr" className="truncate text-start font-mono text-h3 font-medium text-text">
              {c.code}
            </h1>
            <p dir="auto" className="text-body text-text-muted">
              {discountLabel(c, lang)}
            </p>
            <div className="flex flex-wrap items-center gap-ctl-row pt-space-2">
              <CodeStatusBadge status={c.status} />
              <Badge tone="neutral">{p.uses(c.uses, c.maxUses)}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-ctl-row">
            <CopyButton size="sm" text={c.code} label={p.actions.copy} copiedMessage={p.copied} failedMessage={p.copyFailed} />
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon name="layer-group" size={16} />}
              onClick={() => void actions.disableAll(c.batchId)}
              loading={actions.disabling === c.batchId}
            >
              {p.actions.disableBatch}
            </Button>
            {c.status !== "disabled" && (
              <Button variant="danger" size="sm" icon={<Icon name="times" size={16} />} onClick={() => void actions.disable(c)} loading={actions.disabling === c.id}>
                {p.actions.disable}
              </Button>
            )}
          </div>
        </div>
      </ContentCard>
      <Facts code={c} />
      <Redemptions redemptions={c.redemptions} />
      <Audit code={c} />
    </>
  );
}

function Facts({ code: c }: { code: PromoCodeDetail }) {
  const { p, lang, isAr } = useAdminPromoLang();
  const d = p.detail;
  const types = c.accountTypes?.length ? c.accountTypes.map((t) => (ACCOUNT_TYPES[t] ? (isAr ? ACCOUNT_TYPES[t].arLabel : ACCOUNT_TYPES[t].label) : t)).join(isAr ? "، " : ", ") : d.allTypes;
  const items: KeyValueItem[] = [
    { label: d.discount, value: <span dir="auto">{discountLabel(c, lang)}</span> },
    { label: d.uses, value: <span className="tabular-nums">{p.uses(c.uses, c.maxUses)}</span> },
    {
      label: d.batch,
      value: (
        <Link href={`/admin/billing?tab=codes&batch=${encodeURIComponent(c.batchId)}`} dir="ltr" className="font-mono">
          {shortBatch(c.batchId)}
        </Link>
      ),
    },
    { label: d.expires, value: c.expiresAt ? day(c.expiresAt, lang) : p.table.never },
    { label: d.created, value: day(c.createdAt, lang) },
  ];
  if (c.firstPurchaseOnly !== undefined) items.push({ label: d.firstPurchase, value: c.firstPurchaseOnly ? d.yes : d.no });
  if (c.accountTypes !== undefined) items.push({ label: d.types, value: types });
  if (c.note) items.push({ label: d.note, value: <span dir="auto">{c.note}</span> });
  return (
    <ContentCard title={d.facts}>
      <KeyValueList layout="grid" items={items} />
    </ContentCard>
  );
}

/** Who redeemed the code and what each brand pays now, newest first as the server sends it. Rows carry no actions. */
function Redemptions({ redemptions }: { redemptions: PromoRedemption[] }) {
  const { p, lang, isAr } = useAdminPromoLang();
  const d = p.detail;
  const columns: DataColumn<PromoRedemption>[] = [
    { key: "brand", header: d.brand, cell: (r) => <span dir="auto" className="font-medium text-text">{r.brand?.name ?? d.deletedBrand}</span> },
    {
      key: "owner",
      header: d.owner,
      cell: (r) =>
        r.owner ? (
          <Link href={`/admin/users/${encodeURIComponent(r.owner.id)}`} dir="ltr">
            {r.owner.email}
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "date", header: d.date, cell: (r) => <span className="tabular-nums">{day(r.createdAt, lang)}</span> },
    { key: "status", header: d.redemptionStatus, cell: (r) => <Badge tone={r.status === "active" ? "success" : "neutral"}>{d.redemptionStatuses[r.status] ?? r.status}</Badge> },
    { key: "paying", header: d.payingNow, cell: (r) => <span className="tabular-nums">{money(r.payingNow, r.currency ?? "usd", lang)}</span> },
  ];
  return (
    <ContentCard title={d.redemptions} flush>
      {redemptions.length === 0 ? (
        <div className="px-space-8 pb-space-8">
          <EmptyHint>{d.redemptionsEmpty}</EmptyHint>
        </div>
      ) : (
        <DataTable
          label={d.redemptions}
          itemLabel={d.redemptions}
          dir={isAr ? "rtl" : "ltr"}
          columns={columns}
          rows={redemptions}
          getRowId={(r) => `${r.brand?.id ?? "deleted"}-${r.createdAt}`}
          getRowLabel={(r) => r.brand?.name ?? d.deletedBrand}
          stickyHeader={false}
          mobileCard={{ primary: "brand", secondary: ["owner", "date", "status", "paying"] }}
        />
      )}
    </ContentCard>
  );
}

/** Every generate and disable on this code, with its note, as the server logged it. */
function Audit({ code: c }: { code: PromoCodeDetail }) {
  const { p, b, lang, isAr } = useAdminPromoLang();
  const d = p.detail;
  const entries = c.audit ?? [];
  type Entry = (typeof entries)[number];
  const columns: DataColumn<Entry>[] = [
    { key: "date", header: d.date, cell: (e) => <span className="tabular-nums">{day(e.createdAt, lang)}</span> },
    { key: "action", header: b.audit.action, cell: (e) => b.audit.actions[e.action] ?? e.action },
    { key: "actor", header: b.audit.actor, cell: (e) => (e.actor ? <span dir="ltr">{e.actor.email}</span> : b.audit.system) },
    { key: "reason", header: b.audit.reason, cell: (e) => <span dir="auto">{e.reason}</span> },
  ];
  return (
    <ContentCard title={d.audit} flush>
      {entries.length === 0 ? (
        <div className="px-space-8 pb-space-8">
          <EmptyHint>{d.auditEmpty}</EmptyHint>
        </div>
      ) : (
        <DataTable
          label={d.audit}
          itemLabel={d.audit}
          dir={isAr ? "rtl" : "ltr"}
          columns={columns}
          rows={entries}
          getRowId={(e) => e.id}
          getRowLabel={(e) => b.audit.actions[e.action] ?? e.action}
          stickyHeader={false}
          mobileCard={{ primary: "action", secondary: ["date", "actor", "reason"] }}
        />
      )}
    </ContentCard>
  );
}
