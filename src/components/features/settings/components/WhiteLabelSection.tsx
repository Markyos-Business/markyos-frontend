"use client";

import { useApp } from "@/contexts/AppContext";
import { Row, Section, Switch } from "@/components/ui";
import type { Workspace } from "@/types";

/** Dropping the Markyos footer from the client viewer. */
export function WhiteLabelSection({ ws, typeLabel, isAr }: { ws: Workspace; typeLabel: string; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { toggleWhiteLabel } = useApp();
  return (
    <Section title={t("White-label", "بدون علامة ماركيوس")} icon="id-badge">
      <Row
        label={t("Remove Markyos branding", "إزالة علامة ماركيوس")}
        hint={
          isAr
            ? `يحذف التذييل الصغير "دليل مقدَّم عبر ماركيوس" من عرض العميل. مضمّن تلقائيًا في خطة ${typeLabel}.`
            : `Drops the small 'Guideline delivered with Markyos' footer from the client viewer. Included automatically on the ${typeLabel} plan.`
        }
        right={
          <Switch
            label={t("Remove Markyos branding", "إزالة علامة ماركيوس")}
            checked={ws.whiteLabel || ws.billing.plan === "subscription"}
            onToggle={() => toggleWhiteLabel(ws.id, !ws.whiteLabel)}
          />
        }
      />
    </Section>
  );
}
