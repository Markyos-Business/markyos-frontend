"use client";

import { Row, Section, Switch } from "@/components/ui";
import { useAccountLang } from "../../hooks/shared/use-account-lang";

/**
 * Single sign-on. No identity provider is connected yet, so the switch stays
 * off and disabled and the card says how to get it, rather than offering a
 * setting that would do nothing. The provider and domain fields come back
 * once SSO is real.
 */
export function SsoSection() {
  const { t } = useAccountLang();
  const label = t("Require SSO for this account", "فرض الدخول الموحّد لهذا الحساب");
  return (
    <Section title={t("Single sign-on", "الدخول الموحّد")} icon="id-badge">
      <Row
        label={label}
        hint={t("Available on Enterprise. Contact us to set it up.", "متاح في باقة المؤسسات. تواصل معنا لتفعيله.")}
        right={<Switch label={label} checked={false} onToggle={() => {}} disabled />}
      />
    </Section>
  );
}
