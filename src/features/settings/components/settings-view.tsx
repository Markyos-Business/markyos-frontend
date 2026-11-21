import { AlertBanner, AppFooter, PageHeader } from "@/components/ui";
import { PAGE_SECTION, SHOW_UNFINISHED_SETTINGS } from "../constants";
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
import { OwnerOnly } from "./owner-only";
import { VersionHistorySection } from "@/features/team";

/** A brand's settings, section by section. Keyed by brand so drafts start over on another brand. */
export function SettingsView({ ws, isAr, typeLabel, prices, clientLink, canGovern, canEdit, actorName, tab }: SettingsViewProps) {
  const locked = !canGovern;
  if (tab === "activity") {
    return (
      <div key={ws.id} className="flex min-h-0 max-w-[720px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
        <PageHeader
          title={isAr ? "النشاط" : "Activity"}
          description={isAr ? `النسخ المحفوظة من ${ws.name}، وكيف تعود إلى إحداها.` : `Saved versions of ${ws.name}, and how to go back to one.`}
        />
        <VersionHistorySection ws={ws} isAr={isAr} actorName={actorName} canEdit={canEdit} />
        <AppFooter lang={isAr ? "ar" : "en"} className="mt-auto" />
      </div>
    );
  }
  return (
    <div key={ws.id} className="flex min-h-0 max-w-[720px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <PageHeader title={isAr ? PAGE_SECTION.ar : PAGE_SECTION.en} description={SHOW_UNFINISHED_SETTINGS
            ? isAr ? `الوصول للعميل والنطاق الخاص والفوترة والتكاملات لعلامة ${ws.name}.` : `Client access, custom domain, billing and integrations for ${ws.name}.`
            : isAr ? `الوصول للعميل والتصميم والفوترة لعلامة ${ws.name}.` : `Client access, design and billing for ${ws.name}.`} />
      {locked && (
        <AlertBanner
          tone="info"
          message={
            isAr
              ? "الوصول والعلامة التجارية يغيّرها مالك العلامة فقط. يمكنك تعديل التصميم والرموز."
              : "Only the brand's owner can change access and branding. You can still change design and tokens."
          }
        />
      )}
      <BrandSection ws={ws} isAr={isAr} />
      <OwnerOnly locked={locked}><ClientAccessSection ws={ws} clientLink={clientLink} isAr={isAr} /></OwnerOnly>
      <GuidelineDesignSection ws={ws} isAr={isAr} />
      {SHOW_UNFINISHED_SETTINGS && <OwnerOnly locked={locked}><SubdomainSection ws={ws} isAr={isAr} /></OwnerOnly>}
      {SHOW_UNFINISHED_SETTINGS && <OwnerOnly locked={locked}><CustomDomainSection ws={ws} isAr={isAr} /></OwnerOnly>}
      <BillingSection ws={ws} typeLabel={typeLabel} prices={prices} isAr={isAr} />
      <OwnerOnly locked={locked}><WhiteLabelSection ws={ws} typeLabel={typeLabel} isAr={isAr} /></OwnerOnly>
      {SHOW_UNFINISHED_SETTINGS && <OwnerOnly locked={locked}><DeveloperSection ws={ws} isAr={isAr} /></OwnerOnly>}
      <DesignTokensSection ws={ws} isAr={isAr} canGovern={canGovern} />
      <AppFooter lang={isAr ? "ar" : "en"} className="mt-auto" />
    </div>
  );
}
