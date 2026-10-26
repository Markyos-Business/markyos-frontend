"use client";

import { BrandLimitView, NewBrandView, useNewBrandPage } from "@/components/features/brands";

export default function NewWorkspacePage() {
  const page = useNewBrandPage();
  if (!page) return null;
  return page.view ? <NewBrandView {...page.view} /> : <BrandLimitView {...page.limit} />;
}
