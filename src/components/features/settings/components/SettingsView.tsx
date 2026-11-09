import { PAGE_SECTION } from "../constants";
import type { SettingsView as SettingsViewProps } from "../hooks/useSettingsPage";
import { BillingSection } from "./BillingSection";
import { BrandSection } from "./BrandSection";
import { ClientAccessSection } from "./ClientAccessSection";
import { CustomDomainSection } from "./CustomDomainSection";
import { DesignTokensSection } from "./DesignTokensSection";
import { DeveloperSection } from "./DeveloperSection";
import { GuidelineDesignSection } from "./GuidelineDesignSection";
import { SubdomainSection } from "./SubdomainSection";
import { WhiteLabelSection } from "./WhiteLabelSection";

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
