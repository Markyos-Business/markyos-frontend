"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { useStudioPage } from "@/contexts/pageGuards";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "@/constants/accountTypes";
import type { StartMode } from "../../constants";
import { useBrandImport } from "../import/useBrandImport";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/** The new-brand page: start from a name or from a guideline file, unless the account is at its brand limit. */
export function useNewBrandPage() {
  const { state, logout, myWorkspaces, createWorkspace } = useApp();
  const { ready } = useStudioPage();
  const router = useRouter();
  const account = useCurrentAccount();
  const importer = useBrandImport();
  const [mode, setMode] = useState<StartMode>("scratch");
  const [name, setName] = useState("");
  const { isAr } = useInterfaceLang();
  if (!ready) return null;

  const type = ACCOUNT_TYPES[accountTypeOf(account)];
  // Reachable by URL even at the limit, so it says so here too; the server
  // refuses the create either way.
  const brandLimit = limitsOf(account).brands;
  const owned = myWorkspaces.filter((w) => w.ownerAccountId === state.session?.accountId).length;
  if (brandLimit !== null && owned >= brandLimit) {
    return {
      limit: {
        title: isAr ? `وصلت إلى حد حساب ${type.arLabel}` : `You're at your ${type.label.toLowerCase()} limit`,
        description: isAr
          ? `حسابات ${type.arLabel} تملك حتى ${brandLimit} ${brandLimit === 1 ? type.arHome.noun : type.arHome.nounPlural}. خطط العلامات المدفوعة لا تزيد حد هذا الحساب.`
          : `${type.label} accounts own up to ${brandLimit} ${brandLimit === 1 ? type.home.noun : type.home.nounPlural}. Per-brand plans do not increase this account limit.`,
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
      scratch: { ...(isAr ? type.arNewBrand : type.newBrand), name, onName: setName, onSubmit: submit },
      importer,
    },
  };
}

export type NewBrandView = NonNullable<NonNullable<ReturnType<typeof useNewBrandPage>>["view"]>;
