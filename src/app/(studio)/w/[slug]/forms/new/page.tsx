"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { canEdit, roleOn } from "@/lib/data/access";
import { DiscoveryFrame, NewFormView } from "@/components/features/discovery";

export default function BrandNewFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { getWorkspace, uiLang, myWorkspaces, state } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  const brands = myWorkspaces.filter((w) => canEdit(roleOn(w, state.session)));
  return (
    <>
      <TopBar workspace={ws} section="New form" arSection="نموذج جديد" />
      <DiscoveryFrame isAr={isAr}>
        <NewFormView
          brands={brands.map((w) => ({ id: w.id, name: w.name }))}
          defaultBrandId={ws.id}
          isAr={isAr}
          onCreated={(form) => router.push(`/w/${form.workspaceSlug}/forms/${form.id}/edit`)}
          onCancel={() => router.push(`/w/${ws.slug}/forms`)}
        />
      </DiscoveryFrame>
    </>
  );
}
