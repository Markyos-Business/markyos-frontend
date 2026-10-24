"use client";

import { useRequest } from "@/hooks/useRequest";
import { getResponses } from "../services/discoveryService";

export function useResponses(formId: string) {
  return useRequest(() => getResponses(formId), formId);
}
