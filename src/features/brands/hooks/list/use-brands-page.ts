"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf } from "@/constants/accountTypes";
import { useLimits, useUpgrade } from "@/features/billing";
import { isReviewerOnly, roleOn } from "@/lib/data/access";
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
  const limits = useLimits(account);
  const upgrade = useUpgrade();

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
  const brandLimit = limits.type.brands;
  const mine = myWorkspaces.filter((w) => w.ownerAccountId === state.session?.accountId);
  const owned = mine.length;
  const atLimit = brandLimit !== null && owned >= brandLimit;
  // The Free rule (billing epic): one brand without a plan per account.
  // Subscribing one makes room, so the upgrade modal opens on it.
  const unpaid = mine.filter((w) => w.billing?.plan === "free");
  const needsPlan = limits.freeBrands !== null && unpaid.length >= limits.freeBrands ? unpaid[0] : undefined;
  const home = lang === "ar" ? type.arHome : type.home;
  const limitNote = c.limitNote(lang === "ar" ? type.arLabel : type.label, brandLimit, brandLimit === 1 ? home.noun : home.nounPlural);

  if (!hydrated || !state.session) return null;
  // A client reviewer's home is what was shared with them, nothing to create.
  const reviewer = isReviewerOnly(myWorkspaces, state.session);

  return {
    header: { query, onQuery: setQuery, c },
    view: {
      title: reviewer ? (lang === "ar" ? "العلامات المشاركة معك" : "Brands shared with you") : account?.isAdmin ? c.yourBrands : home.title,
      description: reviewer
        ? lang === "ar" ? "افتح علامة لمراجعة دليلها." : "Open a brand to review its guideline."
        : c.summary(myWorkspaces.length, sharedCount, owned, brandLimit),
      reviewer,
      sort,
      c,
      lang,
      onSort: setSort,
      onNew: () => {
        if (atLimit) return router.push("/brands/new");
        if (needsPlan) return upgrade.open({ ws: needsPlan, reason: "brand_limit", onDone: () => router.push("/brands/new") });
        router.push("/brands/new");
      },
      brands: workspaces.map((ws) => ({ workspace: ws, role: roleOn(ws, state.session) })),
      atLimit,
      limitNote,
    },
  };
}
