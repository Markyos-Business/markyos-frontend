"use client";

import { useRequest } from "@/hooks/useRequest";
import { listBrandForms } from "../services/callNotesService";

export function useBrandForms(brandId: string) {
  return useRequest(() => listBrandForms(brandId), brandId);
}
