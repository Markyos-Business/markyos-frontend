"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { BuilderView, DiscoveryFrame } from "@/components/features/discovery";

export default function FormBuilderPage() {
  const { slug, formId } = useParams<{ slug: string; formId: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  return (
    <>
      <TopBar workspace={ws} section="Discovery forms" arSection="نماذج الاستكشاف" />
      <DiscoveryFrame isAr={isAr} wide>
        <BuilderView formId={formId} sendHref={`/w/${ws.slug}/forms/${formId}/send`} isAr={isAr} />
      </DiscoveryFrame>
    </>
  );
}
