"use client";

import { BrandsHeader, BrandsView, useBrandsPage } from "@/components/features/brands";

export default function BrandsPage() {
  const page = useBrandsPage();
  if (!page) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <BrandsHeader {...page.header} />
      <BrandsView {...page.view} />
    </div>
  );
}
