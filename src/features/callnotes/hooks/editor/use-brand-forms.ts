"use client";

import { useRequest } from "@/hooks/useRequest";
import { listBrandForms } from "../../api/call-notes.api";

export function useBrandForms(brandId: string) {
  return useRequest(() => listBrandForms(brandId), brandId);
}
