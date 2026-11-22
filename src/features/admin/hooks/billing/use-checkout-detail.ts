"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useRequest } from "@/hooks/useRequest";
import { getCheckout } from "../../api/admin-billing.api";
import type { AdminCheckoutDetail } from "../../types";

/** One checkout. `data.checkout` is null when there's no such checkout: a 404 is an answer, not an error. */
export function useCheckoutDetail(id: string) {
  // A sync answers with the fresh detail; it's shown until the next read.
  const [synced, setSynced] = useState<AdminCheckoutDetail | null>(null);
  const request = useRequest(
    () =>
      getCheckout(id).then(
        (checkout) => {
          setSynced(null);
          return { checkout: checkout as AdminCheckoutDetail | null };
        },
        (err: unknown) => (err instanceof ApiError && err.status === 404 ? { checkout: null } : Promise.reject(err)),
      ),
    `checkout:${id}`,
  );
  const checkout = synced ?? request.data?.checkout ?? null;
  return { request, checkout, notFound: request.data !== null && request.data.checkout === null, setSynced };
}
