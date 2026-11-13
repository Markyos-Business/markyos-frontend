"use client";

import { useSearchParams } from "next/navigation";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { BlockScopeProvider } from "../content/block-renderer";
import { BrandFonts } from "../shared/brand-fonts";
import { GuidelineMotion } from "./guideline-motion";
import { SignOffSurface } from "./sign-off-panel";
import { CenteredMessage, PasswordGate } from "./viewer-chrome";
import { DeckTemplate } from "../templates/deck-template";
import { DocsTemplate } from "../templates/docs-template";
import { ManualTemplate } from "../templates/manual-template";
import { MosaicTemplate } from "../templates/mosaic-template";
import { StudioTemplate } from "../templates/studio-template";
import { VaultTemplate } from "../templates/vault-template";
import { useGuidelineViewer } from "../../hooks/use-guideline-viewer";

/**
 * The client guideline at /v/<slug>, or one of its custom pages at
 * /v/<slug>/p/<page>: the same gating (published, plan, password) and nav
 * chrome either way; on a page, the content area shows only that page's own
 * blocks. See hooks/useGuidelineViewer.ts for the shared logic.
 */
export function ClientGuideView({ slug, page }: { slug: string; page?: string }) {
  const search = useSearchParams();
  // ?preview=1 is how the studio checks its unpublished draft; without it this
  // route only ever serves the last published snapshot.
  const isPreview = search.get("preview") === "1";
  const v = useGuidelineViewer(slug, page, isPreview ? "draft" : "published");
  // Before there is a guideline to take a language from, the reader's own.
  const { isAr: readerAr } = useInterfaceLang();

  if (!v.hydrated || !v.checkedStorage) return null;

  if (v.notPublished) {
    return (
      <CenteredMessage
        icon="clock"
        title="Not published yet"
        arTitle="لم يُنشر بعد"
        body="This brand guideline hasn't been published yet. Check back once its owner shares it."
        arBody="لم يُنشر دليل العلامة هذا بعد. يمكنك العودة إليه عندما يشاركه مالك العلامة."
        isAr={v.unpublishedLocale ? v.unpublishedLocale === "ar" : readerAr}
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
        isAr={readerAr}
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
        body="This brand guideline isn't available yet. Check back once its owner publishes it."
        arBody="هذا الدليل غير متاح بعد. يمكنك العودة إليه بعد أن ينشره مالك العلامة."
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
    <SignOffSurface enabled={!isPreview}>
    <BlockScopeProvider blocks={v.allBlocks}>
      <BrandFonts fonts={v.fonts} isAr={isAr}>
        <h1 className="sr-only">{v.activePage ? (isAr ? v.activePage.arName || v.activePage.name : v.activePage.name) : `${ws.name} · ${isAr ? "دليل الهوية" : "Brand guideline"}`}</h1>
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
    </SignOffSurface>
  );
}
