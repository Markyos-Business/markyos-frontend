"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { useStudioPage } from "@/contexts/pageGuards";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "@/constants/accountTypes";
import type { StartMode } from "../constants";
import { useBrandImport } from "./useBrandImport";

/** The new-brand page: start from a name or from a guideline file, unless the account is at its brand limit. */
export function useNewBrandPage() {
  const { state, logout, myWorkspaces, createWorkspace } = useApp();
  const { ready } = useStudioPage();
  const router = useRouter();
  const account = useCurrentAccount();
  const importer = useBrandImport();
  const [mode, setMode] = useState<StartMode>("scratch");
  const [name, setName] = useState("");
  if (!ready) return null;

  const type = ACCOUNT_TYPES[accountTypeOf(account)];
  // Reachable by URL even at the limit, so it says so here too; the server
  // refuses the create either way.
  const brandLimit = limitsOf(account).brands;
  const owned = myWorkspaces.filter((w) => w.ownerAccountId === state.session?.accountId).length;
  if (brandLimit !== null && owned >= brandLimit) {
    return {
      limit: {
        title: `You're at your ${type.label.toLowerCase()} limit`,
        description: `${type.label} accounts own up to ${brandLimit} ${brandLimit === 1 ? type.home.noun : type.home.nounPlural}. Contact Markyos to change your plan.`,
      },
      view: null,
    };
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const ws = createWorkspace(trimmed);
    router.push(`/w/${ws.slug}/overview`);
  }

  return {
    limit: null,
    view: {
      mode,
      onMode: setMode,
      onLogout: () => {
        logout();
        router.push("/login");
      },
      scratch: { title: type.newBrand.title, description: type.newBrand.description, name, onName: setName, onSubmit: submit },
      importer,
    },
  };
}

export type NewBrandView = NonNullable<NonNullable<ReturnType<typeof useNewBrandPage>>["view"]>;
