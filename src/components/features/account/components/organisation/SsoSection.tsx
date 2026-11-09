"use client";

import { Button, Row, Section, Switch } from "@/components/ui";
import { InputField } from "@/components/form";
import { SSO_PROVIDERS } from "../../constants";
import type { AccountPageState } from "../../hooks/useAccountPage";
import { useAccountLang } from "../../hooks/shared/useAccountLang";

/** Requiring single sign-on, and which provider and domain. */
export function SsoSection({ enabled, provider, domain, onToggle, onProvider, onDomain }: AccountPageState["sso"]) {
  const { t } = useAccountLang();
  return (
    <Section title={t("Single sign-on", "الدخول الموحّد")} icon="id-badge">
      <Row
        label={t("Require SSO for this account", "فرض الدخول الموحّد لهذا الحساب")}
        hint={t("Blocks email/password login once a real identity provider is connected. Enterprise procurement checkbox — needs WorkOS or Auth0 wired up for real.", "يمنع الدخول بالبريد وكلمة المرور عند ربط مزوّد هوية فعلي. متطلب للمؤسسات، ويحتاج ربط WorkOS أو Auth0 فعليًا.")}
        right={<Switch label={t("Require SSO for this account", "فرض الدخول الموحّد لهذا الحساب")} checked={enabled} onToggle={onToggle} />}
      />
      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-6">
          <div className="flex flex-col gap-space-2">
            <span className="text-caption text-text-muted">{t("Provider", "المزوّد")}</span>
            <div className="flex gap-space-3">
              {SSO_PROVIDERS.map((p) => (
                <Button key={p} size="sm" variant={provider === p ? "ghost" : "outline"} aria-pressed={provider === p} onClick={() => onProvider(p)}>
                  {p}
                </Button>
              ))}
            </div>
          </div>
          <InputField label={t("Company domain", "نطاق الشركة")} dir="ltr" value={domain} onChange={(e) => onDomain(e.target.value)} placeholder="yourcompany.com" />
        </div>
      )}
    </Section>
  );
}
