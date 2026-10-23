"use client";

import { useParams, useSearchParams } from "next/navigation";
import {
  useGuidelineViewer,
  CenteredMessage,
  PasswordGate,
  VaultTemplate,
  DocsTemplate,
  StudioTemplate,
  DeckTemplate,
  ManualTemplate,
  MosaicTemplate,
  BlockScopeProvider,
  BrandFonts,
  GuidelineMotion,
} from "@/components/features/guideline-site";

/** A real, addressable URL for one custom guideline page — same gating and
 *  nav chrome as Home, but the content area shows only that page's own
 *  blocks. See lib/useGuidelineViewer.ts for the shared logic. */
export default function ClientGuidePageViewer() {
  const params = useParams<{ slug: string; page: string }>();
  const search = useSearchParams();
  const isPreview = search.get("preview") === "1";
  const v = useGuidelineViewer(params.slug, params.page, isPreview ? "draft" : "published");

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
        verify={v.verifyPassword}
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

  if (v.pageNotFound) {
    return (
      <CenteredMessage
        icon="unlink"
        title="This page isn't valid"
        arTitle="هذه الصفحة غير صالحة"
        body="It may have been renamed or removed — check the guideline's other pages."
        arBody="قد تكون قد أُعيدت تسميتها أو حُذفت — راجع صفحات الدليل الأخرى."
        isAr={ws.primaryLocale === "ar"}
        theme={theme}
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
    activePage: v.activePage,
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
