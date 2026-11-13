import { PAGE_SECTION } from "../constants";
import type { SettingsView as SettingsViewProps } from "../hooks/use-settings-page";
import { BillingSection } from "./billing/billing-section";
import { BrandSection } from "./brand/brand-section";
import { ClientAccessSection } from "./access/client-access-section";
import { CustomDomainSection } from "./access/custom-domain-section";
import { DesignTokensSection } from "./design/design-tokens-section";
import { DeveloperSection } from "./developer/developer-section";
import { GuidelineDesignSection } from "./design/guideline-design-section";
import { SubdomainSection } from "./access/subdomain-section";
import { WhiteLabelSection } from "./billing/white-label-section";

/** A brand's settings, section by section. Keyed by brand so drafts start over on another brand. */
export function SettingsView({ ws, isAr, typeLabel, prices, clientLink }: SettingsViewProps) {
  return (
    <div key={ws.id} className="flex min-h-0 max-w-[720px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? PAGE_SECTION.ar : PAGE_SECTION.en}</h1>
        <p className="text-[14px] text-text-muted">
          {isAr ? `الوصول للعميل والنطاق الخاص والفوترة والتكاملات لعلامة ${ws.name}.` : `Client access, custom domain, billing and integrations for ${ws.name}.`}
        </p>
      </div>
      <BrandSection ws={ws} isAr={isAr} />
      <ClientAccessSection ws={ws} clientLink={clientLink} isAr={isAr} />
      <GuidelineDesignSection ws={ws} isAr={isAr} />
      <SubdomainSection ws={ws} isAr={isAr} />
      <CustomDomainSection ws={ws} isAr={isAr} />
      <BillingSection ws={ws} typeLabel={typeLabel} prices={prices} isAr={isAr} />
      <WhiteLabelSection ws={ws} typeLabel={typeLabel} isAr={isAr} />
      <DeveloperSection ws={ws} isAr={isAr} />
      <DesignTokensSection ws={ws} isAr={isAr} />
    </div>
  );
}
