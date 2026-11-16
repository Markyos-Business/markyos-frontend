"use client";

import { AppFooter } from "@/components/ui";
import { BrandsHeader, BrandsView, BrandsWelcome, useBrandsPage } from "@/features/brands";

export default function BrandsPage() {
  const page = useBrandsPage();
  if (!page) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <BrandsHeader {...page.header} />
      <BrandsWelcome c={page.view.c} lang={page.view.lang} />
      <BrandsView {...page.view} />
      <AppFooter lang={page.view.lang} className="mx-auto w-full max-w-[1240px] px-space-6 pb-space-8 sm:px-space-10" />
    </div>
  );
}
