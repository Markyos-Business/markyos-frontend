"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "@/constants/accountTypes";
import { roleOn } from "@/lib/data/access";
import type { BrandSort } from "../constants";

/** The brands gallery: the signed-in account's brands, searched and sorted, and its brand limit. */
export function useBrandsPage() {
  const { state, hydrated, myWorkspaces } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BrandSort>("updated");

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
  }, [hydrated, state.session, router]);

  // `myWorkspaces`, not every workspace in the browser. Two people can hold
  // accounts here and neither should see the other's brands.
  const workspaces = useMemo(() => {
    const filtered = myWorkspaces.filter((w) => w.name.toLowerCase().includes(query.trim().toLowerCase()));
    return [...filtered].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.updatedAt - a.updatedAt));
  }, [myWorkspaces, query, sort]);

  const sharedCount = myWorkspaces.filter((w) => w.sharedStatus === "shared").length;

  // The account type names what a brand is here ("client brands" for a
  // studio, "your brand" for a company) and how many this account may own.
  const account = useCurrentAccount();
  const type = ACCOUNT_TYPES[accountTypeOf(account)];
  const brandLimit = limitsOf(account).brands;
  const owned = myWorkspaces.filter((w) => w.ownerAccountId === state.session?.accountId).length;
  const atLimit = brandLimit !== null && owned >= brandLimit;
  const limitNote = `${type.label} accounts own up to ${brandLimit} ${brandLimit === 1 ? type.home.noun : type.home.nounPlural}. Contact Markyos to change your plan.`;

  if (!hydrated || !state.session) return null;

  return {
    header: { query, onQuery: setQuery },
    view: {
      title: account?.isAdmin ? "Your brands" : type.home.title,
      description: `${myWorkspaces.length} workspace${myWorkspaces.length === 1 ? "" : "s"} · ${sharedCount} shared with clients${
        brandLimit !== null ? ` · ${owned} of ${brandLimit} used` : ""
      }`,
      sort,
      onToggleSort: () => setSort((s) => (s === "updated" ? "name" : "updated")),
      onNew: () => router.push("/brands/new"),
      brands: workspaces.map((ws) => ({ workspace: ws, role: roleOn(ws, state.session) })),
      atLimit,
      limitNote,
    },
  };
}
