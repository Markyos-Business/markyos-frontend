"use client";

import { Badge } from "@/components/ui";
import { BRAND_ROLE_LABELS, STAGE_LABELS } from "../../constants";
import { useAdminUserBrands } from "../../hooks/useAdminUserBrands";

/** The brands this account owns or is a member of, read-only. */
export function UserBrandsList({ userId }: { userId: string }) {
  const brands = useAdminUserBrands(userId);
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-body font-medium">Brands</h3>
      {brands.loading && !brands.data ? (
        <p className="text-caption text-text-faint">Loading…</p>
      ) : brands.data?.length ? (
        <ul className="flex flex-col">
          {brands.data.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-space-4 py-space-4 shadow-rule-t first:shadow-none">
              <div className="min-w-0">
                <div className="truncate text-body font-medium">{b.name}</div>
                <div className="text-caption text-text-faint">{STAGE_LABELS[b.stage || "none"] ?? b.stage}</div>
              </div>
              <Badge tone={b.role === "owner" ? "accent" : "neutral"}>{BRAND_ROLE_LABELS[b.role]}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-caption text-text-faint">{brands.error ?? "No brands yet."}</p>
      )}
    </section>
  );
}
