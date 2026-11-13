"use client";

import { useRequest } from "@/hooks/useRequest";
import { listTemplates } from "../api/discovery.api";

export function useTemplates() {
  return useRequest(listTemplates, "templates");
}
