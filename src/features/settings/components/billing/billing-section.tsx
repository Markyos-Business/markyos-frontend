"use client";

import { Badge, Button, Row, Section } from "@/components/ui";
import type { Workspace } from "@/types";

/** The plan at a glance; its owner manages it in the Billing tab (billing epic 3.3). */
export function BillingSection({ ws, isAr, isOwner }: { ws: Workspace; isAr: boolean; isOwner: boolean }) {
  const plan = ws.billing.plan === "free" ? (isAr ? "بلا خطة" : "No plan") : ws.billing.plan === "pass" ? (isAr ? "تصريح المشروع" : "Project Pass") : (isAr ? "اشتراك شهري" : "Monthly plan");
  return <Section title={isAr ? "خطة العلامة" : "Brand plan"} icon="credit-card">
    <Row label={isAr ? "الخطة الحالية" : "Current plan"} right={<Badge>{plan}</Badge>} />
    {isOwner && <Button href={`/w/${ws.slug}/settings?tab=billing`}>{isAr ? "إدارة الفوترة" : "Manage billing"}</Button>}
  </Section>;
}
