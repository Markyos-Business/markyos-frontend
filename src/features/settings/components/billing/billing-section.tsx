"use client";

import { Badge, Button, Row, Section } from "@/components/ui";
import { billingCopy, useFreeSite } from "@/features/billing";
import type { Workspace } from "@/types";

/**
 * The plan at a glance; its owner manages it in the Billing tab (billing epic 3.3).
 * For the owner of an unpaid brand it also says what the server says about the
 * account's one free guideline site (25 Nov 2026).
 */
export function BillingSection({ ws, isAr, isOwner }: { ws: Workspace; isAr: boolean; isOwner: boolean }) {
  const plan = ws.billing.plan === "free" ? (isAr ? "بلا خطة" : "No plan") : ws.billing.plan === "pass" ? (isAr ? "تصريح المشروع" : "Project Pass") : (isAr ? "اشتراك شهري" : "Monthly plan");
  const free = useFreeSite(ws);
  const f = billingCopy(isAr).freeSite;
  const hint =
    free?.kind === "this"
      ? f.tabThis(ws.name)
      : free?.kind === "available"
        ? f.tabAvailable(ws.name)
        : free?.kind === "taken"
          ? f.tabTaken(ws.name, free.brand?.name ?? null)
          : undefined;
  return <Section title={isAr ? "خطة العلامة" : "Brand plan"} icon="credit-card">
    <Row
      label={isAr ? "الخطة الحالية" : "Current plan"}
      hint={hint}
      right={<span className="flex flex-wrap items-center justify-end gap-space-3">
        <Badge>{plan}</Badge>
        {free?.kind === "this" && <Badge tone="success">{f.isThis}</Badge>}
      </span>}
    />
    {isOwner && <Button href={`/w/${ws.slug}/settings?tab=billing`}>{isAr ? "إدارة الفوترة" : "Manage billing"}</Button>}
  </Section>;
}
