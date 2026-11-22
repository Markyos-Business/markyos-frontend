"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertBanner, Badge, Button, ContentCard, DataTable, EmptyHint, EmptyState, ErrorState, Icon, KeyValueList, Skeleton, Tag } from "@/components/ui";
import type { DataColumn, KeyValueItem } from "@/components/ui";
import { billingCopy, historyState } from "@/features/billing";
import { errorText } from "@/lib/api/errorText";
import { useBillingActions } from "../../hooks/billing/use-billing-actions";
import { useCheckoutDetail } from "../../hooks/billing/use-checkout-detail";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import type { AdminCheckoutDetail, AdminPayment } from "../../types";
import { compRunning } from "../../utils/billing";
import { CheckoutStatusBadge } from "./checkout-status-badge";
import { CompDialog } from "./comp-dialog";
import { day, money } from "./format";
import { SyncDialog } from "./sync-dialog";

/**
 * One checkout for an admin: our status beside PayPal's (with a mismatch
 * badge when the server says they differ), the dates and amounts, the
 * payments, why it was cancelled, and what can be done: sync from PayPal,
 * comp the brand, or end a comp.
 */
export function CheckoutDetailView({ id }: { id: string }) {
  const { b, lang } = useAdminBillingLang();
  const detail = useCheckoutDetail(id);
  const actions = useBillingActions((fresh) => (fresh ? detail.setSynced(fresh) : detail.request.reload()));
  const back = (
    <Button variant="ghost" href="/admin/billing" icon={<Icon name="arrow-left" size={16} />}>
      {b.detail.back}
    </Button>
  );

  if (detail.notFound) {
    return (
      <>
        {back}
        <EmptyState icon="receipt" title={b.detail.notFound} description={b.detail.notFoundBody} action={back} />
      </>
    );
  }
  if (!detail.checkout) {
    if (detail.request.failure) {
      return (
        <>
          {back}
          <ErrorState message={errorText(detail.request.failure, lang, { en: "Couldn't load this checkout.", ar: "تعذّر تحميل عملية الدفع هذه." })} onRetry={detail.request.reload} />
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

  const c = detail.checkout;
  return (
    <>
      <nav aria-label={b.detail.breadcrumb}>{back}</nav>
      <DetailHeader checkout={c} actions={actions} />
      {c.refused && <AlertBanner tone="danger" message={b.detail.refusedBody} />}
      {c.mismatch && <AlertBanner tone="warning" title={b.detail.mismatch} message={b.detail.mismatchBody} />}
      <Compare checkout={c} />
      <Facts checkout={c} />
      <Payments payments={c.payments} />
      <SyncDialog actions={actions} />
      <CompDialog actions={actions} />
    </>
  );
}

function DetailHeader({ checkout: c, actions }: { checkout: AdminCheckoutDetail; actions: ReturnType<typeof useBillingActions> }) {
  const { b } = useAdminBillingLang();
  const name = c.brand?.name ?? b.table.deletedBrand;
  const brand = c.brand;
  return (
    <ContentCard>
      <div className="flex flex-col gap-space-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-space-2">
          <h1 dir="auto" className="truncate text-h3 font-medium text-text">
            {name}
          </h1>
          {c.owner && (
            <div dir="ltr" className="truncate text-start text-caption text-text-muted">
              {c.owner.email}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-ctl-row pt-space-2">
            <Tag tone={c.provider === "comp" ? "indigo" : "neutral"}>{b.providers[c.provider] ?? c.provider}</Tag>
            <CheckoutStatusBadge status={c.status} refused={c.refused} />
            {c.mismatch && (
              <Badge tone="danger" icon={<Icon name="exclamation-circle" size={16} />}>
                {b.detail.mismatch}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-ctl-row">
          {c.provider === "paypal" && c.subscriptionId && (
            <Button variant="secondary" size="sm" icon={<Icon name="sync" size={16} />} onClick={() => actions.setSyncFor(c)}>
              {b.actions.sync}
            </Button>
          )}
          {compRunning(c) ? (
            <Button
              variant="danger"
              size="sm"
              icon={<Icon name="times" size={16} />}
              onClick={() => void actions.end(c)}
              loading={actions.ending === c.id}
            >
              {b.actions.endComp}
            </Button>
          ) : (
            brand && (
              <Button variant="secondary" size="sm" icon={<Icon name="star" size={16} />} onClick={() => actions.setCompFor({ id: brand.id, name: brand.name })}>
                {b.actions.comp}
              </Button>
            )
          )}
        </div>
      </div>
    </ContentCard>
  );
}

/** Ours beside PayPal's, field by field. Rows carry no actions. */
function Compare({ checkout: c }: { checkout: AdminCheckoutDetail }) {
  const { b, lang, isAr } = useAdminBillingLang();
  const d = b.detail;
  const lastPaid = c.payments.find((p) => p.kind === "sale");
  // Amount over date, so mixed-direction text never runs together in Arabic.
  const paid = (amount: string, date: string) => (
    <span className="inline-flex flex-col">
      <span>{amount}</span>
      <span className="text-caption text-text-muted">{date}</span>
    </span>
  );
  type Row = { key: string; field: string; ours: ReactNode; paypal: ReactNode };
  const rows: Row[] = [
    { key: "status", field: d.status, ours: <CheckoutStatusBadge status={c.status} refused={c.refused} />, paypal: c.paypal ? <CheckoutStatusBadge status={c.paypal.status.toLowerCase()} /> : "—" },
    { key: "next", field: d.nextBilling, ours: day(c.currentPeriodEnd, lang), paypal: c.paypal ? day(c.paypal.nextBillingAt, lang) : "—" },
    {
      key: "last",
      field: d.lastPayment,
      ours: lastPaid ? paid(money(lastPaid.amount, lastPaid.currency, lang), day(lastPaid.occurredAt, lang)) : "—",
      paypal: c.paypal?.lastPaymentAt ? paid(money(c.paypal.lastPaymentAmount?.amount ?? null, c.paypal.lastPaymentAmount?.currency ?? c.currency, lang), day(c.paypal.lastPaymentAt, lang)) : "—",
    },
    { key: "failed", field: d.failedPayments, ours: c.paymentFailedAt ? day(c.paymentFailedAt, lang) : "—", paypal: c.paypal ? String(c.paypal.failedPayments) : "—" },
  ];
  const columns: DataColumn<Row>[] = [
    { key: "field", header: d.field, cell: (r) => <span className="text-text-muted">{r.field}</span> },
    { key: "ours", header: d.ours, cell: (r) => <span className="tabular-nums">{r.ours}</span> },
    { key: "paypal", header: d.paypal, cell: (r) => <span className="tabular-nums">{r.paypal}</span> },
  ];
  return (
    <ContentCard title={d.compare} flush>
      {c.paypal ? (
        <DataTable
          label={d.compare}
          itemLabel={d.compare}
          dir={isAr ? "rtl" : "ltr"}
          columns={columns}
          rows={rows}
          getRowId={(r) => r.key}
          getRowLabel={(r) => r.field}
          stickyHeader={false}
          mobileCard={{ primary: "field", secondary: ["ours", "paypal"] }}
        />
      ) : (
        <div className="px-space-8 pb-space-8">
          <EmptyHint>{d.noPaypal}</EmptyHint>
        </div>
      )}
    </ContentCard>
  );
}

function Facts({ checkout: c }: { checkout: AdminCheckoutDetail }) {
  const { b, lang } = useAdminBillingLang();
  const d = b.detail;
  const items: KeyValueItem[] = [
    {
      label: d.owner,
      value: c.owner ? (
        <Link href={`/admin/users/${encodeURIComponent(c.owner.id)}`} dir="auto">
          {c.owner.name || c.owner.email}
        </Link>
      ) : (
        b.table.noOwner
      ),
    },
    { label: d.plan, value: d.plans[c.plan] ?? c.plan },
    { label: d.amount, value: c.provider === "comp" ? "—" : <span className="tabular-nums">{d.perMonth(money(c.amount, c.currency, lang))}</span> },
    { label: d.subscriptionId, value: c.subscriptionId ? <span dir="ltr">{c.subscriptionId}</span> : "—" },
    { label: d.created, value: day(c.createdAt, lang) },
    { label: d.paidAt, value: day(c.paidAt, lang) },
    { label: d.periodEnd, value: day(c.currentPeriodEnd, lang) },
    { label: d.paymentFailedAt, value: day(c.paymentFailedAt, lang) },
  ];
  if (c.cancelReason) items.push({ label: d.cancelReason, value: b.reasons[c.cancelReason] ?? c.cancelReason });
  if (c.cancelNote) items.push({ label: d.cancelNote, value: <span dir="auto">{c.cancelNote}</span> });
  return (
    <ContentCard title={d.facts}>
      <KeyValueList layout="grid" items={items} />
    </ContentCard>
  );
}

/** The payments ledger PayPal reported, newest first as the server sends it. */
function Payments({ payments }: { payments: AdminPayment[] }) {
  const { b, lang, isAr } = useAdminBillingLang();
  const d = b.detail;
  // The same words as the owner's payment history.
  const { kinds, states } = billingCopy(isAr).tab.history;
  const columns: DataColumn<AdminPayment>[] = [
    { key: "date", header: d.paymentDate, cell: (p) => <span className="tabular-nums">{day(p.occurredAt, lang)}</span> },
    { key: "type", header: d.paymentType, cell: (p) => kinds[p.kind] ?? p.kind },
    { key: "amount", header: d.paymentAmount, cell: (p) => <span className="tabular-nums font-medium text-text">{money(p.amount, p.currency, lang)}</span> },
    {
      key: "status",
      header: d.paymentStatus,
      cell: (p) => {
        const s = historyState(p.state);
        return <Badge tone={s.tone}>{states[s.key]}</Badge>;
      },
    },
  ];
  return (
    <ContentCard title={d.payments} flush>
      {payments.length === 0 ? (
        <div className="px-space-8 pb-space-8">
          <EmptyHint>{d.paymentsEmpty}</EmptyHint>
        </div>
      ) : (
        <DataTable
          label={d.payments}
          itemLabel={d.payments}
          dir={isAr ? "rtl" : "ltr"}
          columns={columns}
          rows={payments}
          getRowId={(p) => p.id}
          getRowLabel={(p) => day(p.occurredAt, lang)}
          stickyHeader={false}
          mobileCard={{ primary: "date", secondary: ["type", "amount", "status"] }}
        />
      )}
    </ContentCard>
  );
}
