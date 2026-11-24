"use client";

import Link from "next/link";
import { Badge, Button, ContentCard, CopyButton, DataTable, EmptyHint, EmptyState, ErrorState, Icon, KeyValueList, Skeleton } from "@/components/ui";
import type { DataColumn, KeyValueItem } from "@/components/ui";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import type { PromoCodeDetail, PromoRedemption } from "@/features/billing";
import type { AccountType } from "@/types";
import { errorText } from "@/lib/api/errorText";
import { usePromoActions } from "../../hooks/billing/use-promo-actions";
import { useCodeDetail } from "../../hooks/billing/use-code-detail";
import { useAdminPromoLang } from "../../hooks/shared/use-admin-lang";
import { ALL_TYPES, discountLabel, shortBatch, usesLabel } from "../../utils/promo";
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
              {discountLabel(c.discount, lang)}
            </p>
            <div className="flex flex-wrap items-center gap-ctl-row pt-space-2">
              <CodeStatusBadge status={c.status} />
              <Badge tone="neutral">{usesLabel(c.uses, lang)}</Badge>
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
  const batch = c.batch;
  const typeName = (t: string) => (t in ACCOUNT_TYPES ? (isAr ? ACCOUNT_TYPES[t as AccountType].arLabel : ACCOUNT_TYPES[t as AccountType].label) : t);
  const allTypes = batch.accountTypes.length === 0 || ALL_TYPES.every((t) => batch.accountTypes.includes(t));
  const items: KeyValueItem[] = [
    { label: d.discount, value: <span dir="auto">{discountLabel(c.discount, lang)}</span> },
    { label: d.uses, value: <span className="tabular-nums">{usesLabel(c.uses, lang)}</span> },
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
    { label: d.firstPurchase, value: batch.firstPurchaseOnly ? d.yes : d.no },
    { label: d.types, value: allTypes ? d.allTypes : batch.accountTypes.map(typeName).join(isAr ? "، " : ", ") },
  ];
  if (batch.note) items.push({ label: d.note, value: <span dir="auto">{batch.note}</span> });
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
    { key: "date", header: d.date, cell: (r) => <span className="tabular-nums">{day(r.activatedAt ?? r.reservedAt, lang)}</span> },
    { key: "status", header: d.redemptionStatus, cell: (r) => <Badge tone={r.status === "active" ? "success" : "neutral"}>{d.redemptionStatuses[r.status] ?? r.status}</Badge> },
    {
      key: "paying",
      header: d.payingNow,
      cell: (r) => (
        <span className="inline-flex flex-col">
          <span className="tabular-nums">{money(r.paysNow.amount, r.paysNow.currency, lang)}</span>
          {r.paysNow.until && <span className="text-caption text-text-muted">{d.paysUntil(day(r.paysNow.until, lang))}</span>}
        </span>
      ),
    },
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
          getRowId={(r) => r.id}
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
  const entries = c.audit;
  type Entry = (typeof entries)[number];
  const columns: DataColumn<Entry>[] = [
    { key: "date", header: d.date, cell: (e) => <span className="tabular-nums">{day(e.createdAt, lang)}</span> },
    { key: "action", header: b.audit.action, cell: (e) => b.audit.actions[e.action] ?? e.action },
    { key: "actor", header: b.audit.actor, cell: (e) => (e.actor ? <span dir="ltr">{e.actor.email}</span> : b.audit.system) },
    { key: "reason", header: b.audit.reason, cell: (e) => <span dir="auto">{e.reason ?? "—"}</span> },
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
