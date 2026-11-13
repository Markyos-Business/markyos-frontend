"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { AppSidebar, AppTopBar, useUiStrings } from "@/components/ui";
import { AssetTable } from "@/features/assets";
import { SIDEBAR_RAILS } from "@/lib/sidebarRails";

/**
 * The sample feature for the folder structure (README "Folder structure"): the
 * shell from the UI kit and the asset table from features/assets. Mock data,
 * so it's a dev page like the galleries. ?state=error or ?state=empty shows
 * those states.
 */
export default function AssetsPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  const { state } = use(searchParams);
  const { isAr } = useUiStrings();
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex min-h-dvh bg-canvas text-text">
      <AppSidebar
        label={t("Library", "المكتبة")}
        title="Markyos"
        titleHref="/assets"
        storageKey={SIDEBAR_RAILS.studio}
        isAr={isAr}
        sections={[
          {
            key: "library",
            label: t("Library", "المكتبة"),
            items: [
              { key: "assets", label: t("Assets", "الأصول"), icon: "file-alt", href: "/assets", active: true },
              { key: "brands", label: t("Brands", "العلامات"), icon: "layer-group", href: "/brands" },
            ],
          },
        ]}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar title={t("Assets", "الأصول")} />
        <main className="mx-auto w-full max-w-6xl px-space-6 pb-space-10 sm:px-space-10">
          <AssetTable simulateError={state === "error"} simulateEmpty={state === "empty"} />
        </main>
      </div>
    </div>
  );
}
