"use client";

import { useRequest } from "@/hooks/useRequest";
import { listTemplates } from "../services/discoveryService";

export function useTemplates() {
  return useRequest(listTemplates, "templates");
}
