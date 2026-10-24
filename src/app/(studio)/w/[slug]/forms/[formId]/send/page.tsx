"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { DiscoveryFrame, ThemeSendView, type LogoChoice } from "@/components/features/discovery";

const LOGO_LABELS = { latin: { en: "Latin logo", ar: "الشعار اللاتيني" }, arabic: { en: "Arabic logo", ar: "الشعار العربي" }, symbol: { en: "Symbol", ar: "الرمز" } };

export default function FormSendPage() {
  const { slug, formId } = useParams<{ slug: string; formId: string }>();
  const { getWorkspace, uiLang, state } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  // The brand's attached logo files; the public form resolves the same ids.
  const logos: LogoChoice[] = (Object.keys(LOGO_LABELS) as (keyof typeof LOGO_LABELS)[])
    .filter((key) => ws.logo[key]?.phase === "attached" && ws.logo[key]?.url)
    .map((key) => ({ id: `logo:${key}`, label: LOGO_LABELS[key][isAr ? "ar" : "en"], url: ws.logo[key].url! }));
  const base = `/w/${ws.slug}/forms/${formId}`;
  return (
    <>
      <TopBar workspace={ws} section="Discovery forms" arSection="نماذج الاستكشاف" />
      <DiscoveryFrame isAr={isAr} wide>
        <ThemeSendView
          formId={formId}
          logos={logos}
          swatches={ws.colors.map((c) => ({ name: c.name, hex: c.hex }))}
          studioName={state.session?.name ?? ws.name}
          answersHref={`${base}/answers`}
          builderHref={`${base}/edit`}
          isAr={isAr}
        />
      </DiscoveryFrame>
    </>
  );
}
