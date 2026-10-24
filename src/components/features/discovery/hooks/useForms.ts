"use client";

import { useRequest } from "@/hooks/useRequest";
import { listForms } from "../services/discoveryService";
import type { FormListQuery } from "../types";

export function useForms(query: FormListQuery) {
  return useRequest(() => listForms(query), JSON.stringify(query));
}
