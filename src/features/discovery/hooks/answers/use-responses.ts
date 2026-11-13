"use client";

import { useRequest } from "@/hooks/useRequest";
import { getResponses } from "../../api/discovery.api";

export function useResponses(formId: string) {
  return useRequest(() => getResponses(formId), formId);
}
