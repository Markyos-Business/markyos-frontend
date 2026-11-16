"use client";

import { BrandsHeader, BrandsView, BrandsWelcome, useBrandsPage } from "@/features/brands";

export default function BrandsPage() {
  const page = useBrandsPage();
  if (!page) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <BrandsHeader {...page.header} />
      <BrandsWelcome c={page.view.c} lang={page.view.lang} />
      <BrandsView {...page.view} />
    </div>
  );
}
