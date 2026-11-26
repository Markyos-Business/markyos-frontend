"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlertBanner,
  Badge,
  Button,
  DataTable,
  EmptyHint,
  formatDayMonth,
  Icon,
  KeyValueList,
  LinkButton,
  PageHeader,
  Section,
  Skeleton,
  useToast,
} from "@/components/ui";
import type { DataColumn, KeyValueItem } from "@/components/ui";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import { useAppActions } from "@/contexts/AppContext";
import { formatMoney } from "@/lib/i18n/format";
import { errorText } from "@/lib/api/errorText";
import type { Billing, Workspace } from "@/types";
import { billingCopy } from "../copy";
import { useBrandBilling } from "../hooks/use-brand-billing";
import { useReactivate } from "../hooks/use-plan-actions";
import type { BillingHistoryItem, BrandBillingAnswer, PendingPlanChange } from "../types";
import { discountLine } from "../utils/promo";
import { accessEndsAt, billingView, freeSiteOf, historyState, resumeDate, STATUS_TONE, type BillingButton } from "../utils/billing-state";
import { CancelPlanDialog } from "./cancel-plan-dialog";
import { useUpgrade } from "./upgrade-provider";

/** `?cancel=1`: opened from a blocked transfer, straight into the cancel flow. */
const CANCEL_PARAM = "cancel";

/**
 * A brand's Billing tab, for its owner (billing epic 3.3): what the server
 * says about the plan, the actions it allows, and the payments. Nothing here
 * is worked out in the browser; a missing value is simply not shown.
 */
export function BrandBillingTab({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const copy = billingCopy(isAr);
  const request = useBrandBilling(ws);
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();
  const { applyServerBilling } = useAppActions();
  const answer = request.data;

  // A blocked transfer sends the owner here to cancel: open the flow once the server allows it.
  useEffect(() => {
    if (!answer?.actions.cancel) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get(CANCEL_PARAM) !== "1") return;
    url.searchParams.delete(CANCEL_PARAM);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening from a link is a one-time sync with the URL
    setCancelling(true);
  }, [answer?.actions.cancel]);

  const cancelled = (billing: Billing, endsAt: number | null) => {
    setCancelling(false);
    applyServerBilling(ws.id, billing);
    const date = endsAt ? formatDayMonth(new Date(endsAt), isAr ? "ar" : "en", true) : null;
    // A subscription on a brand already on Free just stops charging.
    showToast(billing.plan === "free" ? copy.cancelFlow.doneFree : copy.cancelFlow.done(date), "success");
    // Access until and Resume come from the server's next answer.
    request.reload();
  };

  return (
    <div className="flex flex-col gap-space-8" data-billing-tab>
      <PageHeader title={copy.tab.label} description={copy.tab.description(ws.name)} />
      {!answer && request.loading ? (
        <BillingSkeleton />
      ) : !answer ? (
        <AlertBanner
          message={errorText(request.failure, isAr ? "ar" : "en", { en: billingCopy(false).tab.loadFailed, ar: billingCopy(true).tab.loadFailed })}
          action={
            <Button size="sm" variant="secondary" onClick={request.reload}>
              {copy.tab.retry}
            </Button>
          }
        />
      ) : (
        <BillingBody ws={ws} isAr={isAr} answer={answer} onCancel={() => setCancelling(true)} reload={request.reload} />
      )}
      {cancelling && answer && (
        <CancelPlanDialog
          ws={ws}
          isAr={isAr}
          endsAt={accessEndsAt(answer.billing, answer.subscription)}
          onFree={answer.billing.plan === "free"}
          onClose={() => setCancelling(false)}
          onCancelled={(billing) => cancelled(billing, billing.paidUntil ?? accessEndsAt(answer.billing, answer.subscription))}
        />
      )}
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="mk-surface flex flex-col gap-space-5 rounded-card bg-surface-1 p-space-8" aria-hidden>
      <Skeleton className="h-5 w-40 rounded-lg" />
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4 rounded-lg" />
      <Skeleton className="h-4 w-2/3 rounded-lg" />
    </div>
  );
}

function BillingBody({
  ws,
  isAr,
  answer,
  onCancel,
  reload,
}: {
  ws: Workspace;
  isAr: boolean;
  answer: BrandBillingAnswer;
  onCancel: () => void;
  reload: () => void;
}) {
  const copy = billingCopy(isAr);
  const t = copy.tab;
  const lang = isAr ? "ar" : "en";
  const upgrade = useUpgrade();
  const reactivate = useReactivate(ws, reload);
  const [now] = useState(() => Date.now());
  const { billing, subscription: sub, actions } = answer;
  const date = (ms: number | null | undefined) => (ms ? formatDayMonth(new Date(ms), lang, true) : null);
  const money = (cents: number, currency: string) => formatMoney(cents / 100, currency.toUpperCase(), lang);

  const view = billingView(answer, now);
  const { status } = view;
  const type = ws.ownerAccountType ? ACCOUNT_TYPES[ws.ownerAccountType] : null;
  const planName = view.comp
    ? t.compName
    : billing.plan === "free"
      ? t.noPlan
      : billing.plan === "pass"
        ? t.pass
        : type
          ? t.planName(isAr ? type.arLabel : type.label)
          : t.planName("");

  const facts: KeyValueItem[] = [{ label: t.plan, value: planName }];
  if (status !== "none") facts.push({ label: t.status, value: <Badge tone={STATUS_TONE[status]}>{t.statuses[status]}</Badge> });
  if (sub?.amount != null && !view.comp) facts.push({ label: t.amount, value: <span className="tabular-nums">{t.perMonth(money(sub.amount, sub.currency))}</span> });
  if (view.nextChargeAt) facts.push({ label: t.nextCharge, value: date(view.nextChargeAt) });
  if (view.resumesOn) facts.push({ label: t.resumesOn, value: date(view.resumesOn) });
  if (view.accessUntil) facts.push({ label: t.accessUntil, value: date(view.accessUntil) });
  if (sub?.payerEmail) facts.push({ label: t.payer, value: <span dir="ltr">{sub.payerEmail}</span> });
  // The first guideline site is free (25 Nov 2026): the server's word on this brand's slot.
  const free = freeSiteOf(answer, ws.id);
  const f = copy.freeSite;
  if (free?.kind === "this") facts.push({ label: f.label, value: <Badge tone="success">{f.isThis}</Badge> });
  if (free?.kind === "available") facts.push({ label: f.label, value: <Badge tone="neutral">{f.available}</Badge> });
  const freeBody =
    free?.kind === "this"
      ? f.tabThis(ws.name)
      : free?.kind === "available"
        ? f.tabAvailable(ws.name)
        : free?.kind === "taken"
          ? f.tabTaken(ws.name, free.brand?.name ?? null)
          : t.freeBody(ws.name);

  // A promo code's discount, worded from the server's figures only.
  const discount =
    sub?.discount && !view.comp ? discountLine(sub.discount, sub.amount, sub.currency, lang, (ms) => formatDayMonth(new Date(ms), lang, true)) : null;

  const subscribe = () => upgrade.open({ ws, reason: "billing", onDone: reload });
  const resume = () => upgrade.open({ ws, reason: "resume", startsAt: resumeDate(sub), onDone: reload });
  const reactivateButton = (inBanner: boolean) => (
    <Button
      key="reactivate"
      variant="primary"
      size={inBanner ? "sm" : undefined}
      onClick={() => void reactivate.run(isAr)}
      loading={reactivate.busy}
      loadingText={t.reactivating}
    >
      {t.reactivate}
    </Button>
  );
  const updatePayment = (inBanner: boolean) =>
    actions.updatePaymentUrl ? (
      <LinkButton key="update" variant={inBanner ? "primary" : "secondary"} size={inBanner ? "sm" : undefined} href={actions.updatePaymentUrl} external>
        {t.updatePayment}
      </LinkButton>
    ) : null;

  const render: Record<BillingButton, () => ReactNode> = {
    subscribe: () => (
      <Button key="subscribe" variant="primary" onClick={subscribe}>
        {t.subscribe}
      </Button>
    ),
    resume: () => (
      <Button key="resume" variant="primary" onClick={resume}>
        {t.resume}
      </Button>
    ),
    reactivate: () => reactivateButton(false),
    updatePayment: () => updatePayment(false),
    cancel: () => (
      <Button key="cancel" variant="ghost" onClick={onCancel}>
        {t.cancel}
      </Button>
    ),
  };
  const buttons = view.buttons.map((b) => render[b]());
  const bannerAction = view.bannerAction === "updatePayment" ? updatePayment(true) : view.bannerAction === "reactivate" ? reactivateButton(true) : undefined;

  return (
    <>
      {view.banner === "grace" && (
        <AlertBanner tone="warning" title={t.failedTitle} message={t.failedBody(date(sub?.graceEndsAt ?? billing.graceEndsAt))} action={bannerAction} actionPlacement="below" />
      )}
      {view.banner === "awaitingPayment" && <AlertBanner tone="info" message={t.awaitingBody(ws.name)} />}
      {view.banner === "suspended" && (
        <AlertBanner tone="warning" title={t.suspendedTitle} message={t.suspendedBody(ws.name)} action={bannerAction} actionPlacement="below" />
      )}
      {view.banner === "cancelled" && <AlertBanner tone="info" title={t.cancelledTitle} message={t.cancelledBody(ws.name, date(view.accessUntil))} />}
      {view.banner === "queued" && <AlertBanner tone="info" title={t.queuedTitle} message={t.queuedBody(ws.name, date(view.resumesOn))} />}
      {view.pendingChange && <PendingChange isAr={isAr} change={view.pendingChange} currency={sub?.currency ?? "usd"} />}

      <Section title={t.planTitle} icon="credit-card">
        <KeyValueList items={facts} />
        {(view.showFreeBody || free) && (
          <p className="text-body text-text-muted" data-billing-free-site={free?.kind}>
            {freeBody}
          </p>
        )}
        {view.comp && (
          <p className="flex items-start gap-space-3 text-body text-text" data-billing-comp>
            <Icon name="check-circle" size={18} className="mt-0.5 shrink-0 text-accent-text" />
            {view.compUntil ? t.compUntil(date(view.compUntil)!) : t.compName}
          </p>
        )}
        {discount && (
          <p className="flex items-start gap-space-3 text-body text-text" data-billing-discount>
            <Icon name="tag" size={18} className="mt-0.5 shrink-0 text-accent-text" />
            <span>{discount}</span>
          </p>
        )}
        {view.legacy && (
          <p className="flex items-start gap-space-3 text-caption text-text-muted">
            <Icon name="info-circle" size={16} className="mt-0.5 shrink-0" />
            {t.legacy}
          </p>
        )}
        {buttons.length > 0 && <div className="flex flex-wrap gap-ctl-row">{buttons}</div>}
      </Section>

      <History isAr={isAr} history={answer.history} />
    </>
  );
}

/**
 * D2: the owner's account type changed, so the price moves at renewal. When
 * PayPal asks the owner to approve the new price, the server sends the link. Amount, type and date are all the server's.
 */
function PendingChange({ isAr, change, currency }: { isAr: boolean; change: PendingPlanChange; currency: string }) {
  const t = billingCopy(isAr).tab;
  const lang = isAr ? "ar" : "en";
  const type = ACCOUNT_TYPES[change.accountType];
  const amount = formatMoney(change.amount / 100, currency.toUpperCase(), lang);
  const when = change.effectiveAt ? formatDayMonth(new Date(change.effectiveAt), lang, true) : null;
  const note = t.pendingBody(when, amount, type ? (isAr ? type.arLabel : type.label) : change.accountType);
  return (
    <AlertBanner
      tone="info"
      title={t.pendingTitle}
      message={change.approvalUrl ? `${note} ${t.approveBody}` : note}
      actionPlacement="below"
      action={
        change.approvalUrl ? (
          <LinkButton variant="primary" size="sm" href={change.approvalUrl} external>
            {t.approve}
          </LinkButton>
        ) : undefined
      }
    />
  );
}

/** The payments PayPal reported for this brand, newest first as the server sends them. Rows carry no actions. */
function History({ isAr, history }: { isAr: boolean; history: BillingHistoryItem[] }) {
  const h = billingCopy(isAr).tab.history;
  const lang = isAr ? "ar" : "en";
  const columns: DataColumn<BillingHistoryItem>[] = [
    {
      key: "date",
      header: h.date,
      cell: (row) => <span className="tabular-nums">{formatDayMonth(new Date(row.occurredAt), lang, true)}</span>,
      sortValue: (row) => row.occurredAt,
    },
    { key: "type", header: h.type, cell: (row) => h.kinds[row.kind] ?? row.kind },
    {
      key: "amount",
      header: h.amount,
      cell: (row) => <span className="tabular-nums font-medium text-text">{formatMoney(row.amount / 100, row.currency.toUpperCase(), lang)}</span>,
      sortValue: (row) => row.amount,
    },
    {
      key: "status",
      header: h.status,
      cell: (row) => {
        const state = historyState(row.state);
        return <Badge tone={state.tone}>{h.states[state.key]}</Badge>;
      },
    },
  ];
  return (
    <Section title={h.title} icon="receipt">
      {history.length === 0 ? (
        <EmptyHint>{h.empty}</EmptyHint>
      ) : (
        <DataTable
          label={h.title}
          itemLabel={h.title}
          dir={isAr ? "rtl" : "ltr"}
          columns={columns}
          rows={history}
          getRowId={(row) => row.id}
          getRowLabel={(row) => formatDayMonth(new Date(row.occurredAt), lang, true)}
          stickyHeader={false}
          mobileCard={{ primary: "date", secondary: ["type", "amount", "status"] }}
        />
      )}
      <p className="flex items-start gap-space-3 text-caption text-text-muted">
        <Icon name="info-circle" size={16} className="mt-0.5 shrink-0" />
        {h.receipts}
      </p>
    </Section>
  );
}
