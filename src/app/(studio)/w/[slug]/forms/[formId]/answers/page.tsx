"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { AnswersView, DiscoveryFrame } from "@/components/features/discovery";

export default function FormAnswersPage() {
  const { slug, formId } = useParams<{ slug: string; formId: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  const base = `/w/${ws.slug}/forms/${formId}`;
  return (
    <>
      <TopBar workspace={ws} section="Discovery forms" arSection="نماذج الاستكشاف" />
      <DiscoveryFrame isAr={isAr} wide>
        <AnswersView formId={formId} builderHref={`${base}/edit`} sendHref={`${base}/send`} strategyHref={`/w/${ws.slug}/strategy`} isAr={isAr} />
      </DiscoveryFrame>
    </>
  );
}
