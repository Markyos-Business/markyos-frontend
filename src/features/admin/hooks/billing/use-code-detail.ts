"use client";

import { ApiError } from "@/lib/api/client";
import { useRequest } from "@/hooks/useRequest";
import type { PromoCodeDetail } from "@/features/billing";
import { getCode } from "../../api/admin-promo.api";

/** One promo code. `code` is null when there's no such code: a 404 is an answer, not an error. */
export function useCodeDetail(id: string) {
  const request = useRequest(
    () =>
      getCode(id).then(
        (code) => ({ code: code as PromoCodeDetail | null }),
        (err: unknown) => (err instanceof ApiError && err.status === 404 ? { code: null } : Promise.reject(err)),
      ),
    `promo-code:${id}`,
  );
  return { request, code: request.data?.code ?? null, notFound: request.data !== null && request.data !== undefined && request.data.code === null };
}
