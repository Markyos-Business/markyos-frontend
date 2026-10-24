"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { canEdit, roleOn } from "@/lib/data/access";
import { DiscoveryFrame, NewFormView } from "@/components/features/discovery";

export default function StudioNewFormPage() {
  const { state, hydrated, myWorkspaces } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login?next=/forms/new");
  }, [hydrated, state.session, router]);
  if (!hydrated || !state.session) return null;
  const isAr = account?.adminLang === "ar";
  const brands = myWorkspaces.filter((w) => canEdit(roleOn(w, state.session)));
  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex h-screen flex-col pt-space-10">
      <DiscoveryFrame isAr={isAr}>
        <NewFormView
          brands={brands.map((w) => ({ id: w.id, name: w.name }))}
          isAr={isAr}
          onCreated={(form) => router.push(`/w/${form.workspaceSlug}/forms/${form.id}/edit`)}
          onCancel={() => router.push("/forms")}
        />
      </DiscoveryFrame>
    </div>
  );
}
