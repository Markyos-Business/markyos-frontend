"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { DiscoveryFrame } from "@/components/features/discovery";
import { AnalysisView } from "@/components/features/briefs";

export default function BrandAnalysisPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  return (
    <>
      <TopBar workspace={ws} section="Analysis" arSection="التحليل" />
      <DiscoveryFrame isAr={isAr} wide>
        <AnalysisView brandId={ws.id} brandSlug={ws.slug} isAr={isAr} />
      </DiscoveryFrame>
    </>
  );
}
