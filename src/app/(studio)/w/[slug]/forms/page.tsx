"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { DiscoveryFrame, FormsListView } from "@/components/features/discovery";

export default function BrandFormsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  return (
    <>
      <TopBar workspace={ws} section="Discovery forms" arSection="نماذج الاستكشاف" />
      <DiscoveryFrame isAr={isAr}>
        <FormsListView brandId={ws.id} newFormHref={`/w/${ws.slug}/forms/new`} isAr={isAr} />
      </DiscoveryFrame>
    </>
  );
}
