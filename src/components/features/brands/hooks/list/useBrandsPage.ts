"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "@/constants/accountTypes";
import { roleOn } from "@/lib/data/access";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import type { BrandSort } from "../../constants";
import { brandsCopyFor } from "../../copy";

/** The brands gallery: the signed-in account's brands, searched and sorted, and its brand limit. */
export function useBrandsPage() {
  const { state, hydrated, myWorkspaces } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BrandSort>("updated");
  const { lang } = useInterfaceLang();
  const account = useCurrentAccount();
  const c = brandsCopyFor(accountTypeOf(account), lang);

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
  const type = ACCOUNT_TYPES[accountTypeOf(account)];
  const brandLimit = limitsOf(account).brands;
  const owned = myWorkspaces.filter((w) => w.ownerAccountId === state.session?.accountId).length;
  const atLimit = brandLimit !== null && owned >= brandLimit;
  const home = lang === "ar" ? type.arHome : type.home;
  const limitNote = c.limitNote(lang === "ar" ? type.arLabel : type.label, brandLimit, brandLimit === 1 ? home.noun : home.nounPlural);

  if (!hydrated || !state.session) return null;

  return {
    header: { query, onQuery: setQuery, c },
    view: {
      title: account?.isAdmin ? c.yourBrands : home.title,
      description: c.summary(myWorkspaces.length, sharedCount, owned, brandLimit),
      sort,
      c,
      lang,
      onSort: setSort,
      onNew: () => router.push(atLimit ? "/account?tab=billing" : "/brands/new"),
      brands: workspaces.map((ws) => ({ workspace: ws, role: roleOn(ws, state.session) })),
      atLimit,
      limitNote,
    },
  };
}
