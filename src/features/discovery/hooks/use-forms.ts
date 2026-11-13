"use client";

import { useRequest } from "@/hooks/useRequest";
import { listForms } from "../api/discovery.api";
import type { FormListQuery } from "../types";

export function useForms(query: FormListQuery) {
  return useRequest(() => listForms(query), JSON.stringify(query));
}
