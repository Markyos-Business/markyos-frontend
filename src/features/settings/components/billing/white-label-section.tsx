"use client";

import { useApp } from "@/contexts/AppContext";
import { Icon, Row, Section, Switch } from "@/components/ui";
import type { Workspace } from "@/types";

/**
 * "Remove Markyos branding": whether this brand's public pages carry the
 * «صُنع بماركيوس» / "Made with Markyos" badge. Paid plans remove it (on by
 * default, so an upgrade takes it off everywhere at once); a paid brand may
 * switch it back off to give the credit. Free brands always show the badge:
 * the switch is locked, with the upgrade that unlocks it. The server makes the
 * final call from the plan; this only records the paid brand's choice.
 */
export function WhiteLabelSection({ ws, typeLabel, isAr }: { ws: Workspace; typeLabel: string; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { setBrandingCredit } = useApp();
  const paid = ws.billing.plan !== "free";
  const removed = paid && !ws.brandingCredit;
  return (
    <Section title={t("Branding", "علامة ماركيوس")} icon="id-badge">
      <Row
        label={t("Remove Markyos branding", "إزالة علامة ماركيوس")}
        hint={
          paid
            ? removed
              ? t(
                  `Your public pages don't show the “Made with Markyos” badge. Included in the ${typeLabel} plan; switch off to give Markyos the credit.`,
                  `لا تظهر شارة «صُنع بماركيوس» على صفحاتك العامة. مضمّن في خطة ${typeLabel}؛ أوقفه لتنسب الفضل لماركيوس.`
                )
              : t("Your public pages show the “Made with Markyos” badge. Switch on to remove it.", "تظهر شارة «صُنع بماركيوس» على صفحاتك العامة. فعّله لإزالتها.")
            : t(
                "Public pages from a free brand show a small “Made with Markyos” badge. Upgrade to remove it from every page at once.",
                "تظهر شارة «صُنع بماركيوس» الصغيرة على الصفحات العامة للعلامات المجانية. قم بالترقية لإزالتها من كل الصفحات مرة واحدة."
              )
        }
        right={
          <span className="flex items-center gap-space-3">
            {!paid && <Icon name="lock" size={16} className="text-text-muted" />}
            <Switch label={t("Remove Markyos branding", "إزالة علامة ماركيوس")} checked={removed} disabled={!paid} onToggle={() => setBrandingCredit(ws.id, removed)} />
          </span>
        }
      />
    </Section>
  );
}
