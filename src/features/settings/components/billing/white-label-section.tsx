"use client";

import { useAppActions, useSession } from "@/contexts/AppContext";
import { roleOn } from "@/lib/data/access";
import { Button, Icon, Row, Section, Switch } from "@/components/ui";
import { billingCopy, useUpgrade } from "@/features/billing";
import type { Workspace } from "@/types";

/**
 * "Hide the badge" (was "Remove Markyos branding"): whether this brand's public pages carry the
 * «صُنع بماركيوس» / "Made with Markyos" badge. Paid plans remove it (on by
 * default, so an upgrade takes it off everywhere at once); a paid brand may
 * switch it back off to give the credit. Free brands always show the badge:
 * the switch is locked, with the upgrade that unlocks it. The server makes the
 * final call from the plan; this only records the paid brand's choice.
 */
export function WhiteLabelSection({ ws, typeLabel, isAr }: { ws: Workspace; typeLabel: string; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { setBrandingCredit } = useAppActions();
  const paid = ws.billing.plan !== "free";
  const removed = paid && !ws.brandingCredit;
  const upgrade = useUpgrade();
  // Only the owner can subscribe; others see the locked switch and the hint.
  const session = useSession();
  const canSubscribe = !paid && roleOn(ws, session) === "owner";
  return (
    <Section title={t("Made with Markyos badge", "شارة «صُنع بماركيوس»")} icon="id-badge">
      <Row
        label={t("Hide the badge", "إخفاء الشارة")}
        hint={
          paid
            ? removed
              ? t(
                  `Your public pages don't show the “Made with Markyos” badge. Included in the ${typeLabel} plan; switch off to give Markyos the credit.`,
                  `لا تظهر شارة «صُنع بماركيوس» على صفحاتك العامة. مضمّن في خطة ${typeLabel}؛ أوقفه لتنسب الفضل لماركيوس.`
                )
              : t("Your public pages show the “Made with Markyos” badge. Switch on to remove it.", "تظهر شارة «صُنع بماركيوس» على صفحاتك العامة. فعّله لإزالتها.")
            : t(
                "Public pages from a brand without a plan show a small “Made with Markyos” badge. Subscribe this brand to remove it from every page at once.",
                "تظهر شارة «صُنع بماركيوس» الصغيرة على الصفحات العامة للعلامات بلا خطة. اشترك لهذه العلامة لإزالتها من كل الصفحات مرة واحدة."
              )
        }
        right={
          <span className="flex items-center gap-space-3">
            {!paid && <Icon name="lock" size={16} className="text-text-muted" />}
            <Switch label={t("Hide the “Made with Markyos” badge", "إخفاء شارة «صُنع بماركيوس»")} checked={removed} disabled={!paid} onToggle={() => setBrandingCredit(ws.id, removed)} />
          </span>
        }
      />
      {canSubscribe && (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => upgrade.open({ ws, reason: "badge" })}>
          {billingCopy(isAr).reason.billing.title}
        </Button>
      )}
    </Section>
  );
}
