"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useGuidelineViewer } from "@/lib/useGuidelineViewer";
import { CenteredMessage, PasswordGate } from "@/components/workspace/guideline/ViewerChrome";
import { VaultTemplate } from "@/components/workspace/guideline/templates/VaultTemplate";
import { DocsTemplate } from "@/components/workspace/guideline/templates/DocsTemplate";
import { StudioTemplate } from "@/components/workspace/guideline/templates/StudioTemplate";
import { DeckTemplate } from "@/components/workspace/guideline/templates/DeckTemplate";
import { ManualTemplate } from "@/components/workspace/guideline/templates/ManualTemplate";
import { MosaicTemplate } from "@/components/workspace/guideline/templates/MosaicTemplate";
import { BlockScopeProvider } from "@/components/workspace/BlockRenderer";
import { BrandFonts } from "@/components/workspace/guideline/BrandFonts";
import { GuidelineMotion } from "@/components/workspace/guideline/GuidelineMotion";

export default function ClientViewerPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  // ?preview=1 is how the studio checks its unpublished draft; without it this
  // route only ever serves the last published snapshot.
  const isPreview = search.get("preview") === "1";
  const v = useGuidelineViewer(params.slug, undefined, isPreview ? "draft" : "published");

  if (!v.hydrated || !v.checkedStorage) return null;

  if (v.notPublished) {
    return (
      <CenteredMessage
        icon="clock"
        title="Not published yet"
        arTitle="لم يُنشر بعد"
        body="This brand guideline hasn't been published. Its studio will share it once it's ready."
        arBody="لم يتم نشر دليل الهوية هذا بعد. سيشاركه الاستوديو عندما يصبح جاهزًا."
        isAr={false}
      />
    );
  }

  if (!v.ws) {
    return (
      <CenteredMessage
        icon="unlink"
        title="This link isn't valid"
        arTitle="هذا الرابط غير صالح"
        body="The guideline it pointed to may have been renamed or removed."
        arBody="قد يكون الدليل الذي يشير إليه هذا الرابط قد أُعيدت تسميته أو حُذف."
        isAr={false}
      />
    );
  }

  const { ws, theme } = v;
  if (!theme) return null;

  if (ws.billing.plan === "free") {
    return (
      <CenteredMessage
        icon="clock"
        title="Not available yet"
        arTitle="غير متاح بعد"
        body="This brand guideline hasn't been shared with clients — check back once its owner publishes it."
        arBody="لم تتم مشاركة دليل الهوية هذا مع العملاء بعد — يُرجى المراجعة لاحقًا."
        isAr={ws.primaryLocale === "ar"}
        theme={theme}
      />
    );
  }

  if (ws.clientAccess.passwordEnabled && !v.unlocked) {
    return (
      <PasswordGate
        name={ws.name}
        slug={ws.slug}
        expected={ws.clientAccess.password}
        isAr={ws.primaryLocale === "ar"}
        theme={theme}
        onUnlock={() => {
          try {
            window.sessionStorage.setItem(`markyos:client-unlock:${ws.slug}`, "1");
          } catch {
            // best-effort only
          }
          v.setUnlocked(true);
        }}
      />
    );
  }

  const isAr = v.previewLang === "ar";
  const showMarkyosBadge = ws.billing.plan !== "subscription";

  const templateProps = {
    ws,
    isAr,
    theme,
    sections: v.sections,
    activeId: v.activeId,
    scrollTo: v.scrollTo,
    sectionIndex: v.sectionIndex,
    showSection: v.showSection,
    sectionTitle: v.sectionTitle,
    sectionNote: v.sectionNote,
    flow: v.flow,
    statementText: v.statementText,
    attachedSlots: v.attachedSlots,
    photoAssets: v.photoAssets,
    iconAssets: v.iconAssets,
    mockupAssets: v.mockupAssets,
    publishedDepartments: v.publishedDepartments,
    customBlocks: v.customBlocks,
    downloadOpen: v.downloadOpen,
    setDownloadOpen: v.setDownloadOpen,
    previewLang: v.previewLang,
    setPreviewLang: v.setPreviewLang,
    showMarkyosBadge,
    pages: v.pages,
  };

  return (
    <BlockScopeProvider blocks={v.allBlocks}>
      <BrandFonts fonts={v.fonts} isAr={isAr}>
        <GuidelineMotion sectionIds={v.sections.map((s) => s.id)} />
        {ws.guidelineTemplate === "docs" ? (
          <DocsTemplate {...templateProps} />
        ) : ws.guidelineTemplate === "deck" ? (
          <DeckTemplate {...templateProps} />
        ) : ws.guidelineTemplate === "manual" ? (
          <ManualTemplate {...templateProps} />
        ) : ws.guidelineTemplate === "mosaic" ? (
          <MosaicTemplate {...templateProps} />
        ) : ws.guidelineTemplate === "studio" ? (
          <StudioTemplate {...templateProps} />
        ) : (
          <VaultTemplate {...templateProps} />
        )}
      </BrandFonts>
    </BlockScopeProvider>
  );
}
