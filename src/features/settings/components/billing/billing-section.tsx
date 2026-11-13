"use client";

import { Badge, Button, Row, Section } from "@/components/ui";
import type { Workspace } from "@/types";

/** Settings links to the single account-level billing workbench. */
export function BillingSection({ ws, isAr }: { ws: Workspace; typeLabel: string; prices: { pass: number; subscription: number }; isAr: boolean }) {
  const plan = ws.billing.plan === "free" ? (isAr ? "مجانية" : "Free") : ws.billing.plan === "pass" ? "Project Pass" : (isAr ? "اشتراك شهري" : "Monthly plan");
  return <Section title={isAr ? "خطة العلامة" : "Brand plan"} icon="credit-card">
    <Row label={isAr ? "الخطة الحالية" : "Current plan"} right={<Badge>{plan}</Badge>} />
    <Button href="/account?tab=billing">{isAr ? "إدارة الخطط والمدفوعات" : "Manage plans & payments"}</Button>
  </Section>;
}
