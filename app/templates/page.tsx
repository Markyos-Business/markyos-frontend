"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

interface Template {
  id: string;
  name: string;
  tagline: string;
  colors: { name: string; hex: string }[];
  latinFamily: string;
  arabicFamily: string;
  overview: string;
}

const TEMPLATES: Template[] = [
  {
    id: "heritage-fb",
    name: "Heritage F&B",
    tagline: "Warm, tactile, rooted in place — for restaurants, cafés and food brands.",
    colors: [
      { name: "Roast", hex: "#4A2E1F" },
      { name: "Cream", hex: "#F4E9D8" },
      { name: "Clay", hex: "#C46B3E" },
      { name: "Olive", hex: "#6B7A3A" },
    ],
    latinFamily: "Fraunces",
    arabicFamily: "Noto Naskh Arabic",
    overview: "<h2>A table, not a transaction</h2><p>This brand starts from hospitality, not menu engineering. Every surface — packaging, signage, the app — should read as an invitation, not an upsell.</p>",
  },
  {
    id: "modern-tech",
    name: "Modern Tech",
    tagline: "Confident, minimal, dark-canvas — for SaaS and startups.",
    colors: [
      { name: "Ink", hex: "#0B0B0F" },
      { name: "Cloud", hex: "#F5F5FA" },
      { name: "Signal", hex: "#5E5CE6" },
      { name: "Mint", hex: "#34D399" },
    ],
    latinFamily: "Inter",
    arabicFamily: "IBM Plex Sans Arabic",
    overview: "<h2>Built for the next hire, not just the founders</h2><p>The system needs to survive a team of forty, not just the two people who started it. Every rule here exists so someone new can ship on-brand without asking first.</p>",
  },
  {
    id: "boutique-retail",
    name: "Boutique Retail",
    tagline: "Editorial, high-contrast, a little precious — for fashion and lifestyle.",
    colors: [
      { name: "Blanc", hex: "#FAFAF8" },
      { name: "Noir", hex: "#1A1A1A" },
      { name: "Blush", hex: "#E8B4B8" },
      { name: "Gold", hex: "#B08D57" },
    ],
    latinFamily: "Canela",
    arabicFamily: "Aref Ruqaa",
    overview: "<h2>Slow down before you ship</h2><p>Every asset gets the same scrutiny as a print campaign, even a story sticker. Restraint is the brand's actual differentiator.</p>",
  },
  {
    id: "public-sector",
    name: "Public Sector / NGO",
    tagline: "Accessible, trustworthy, WCAG-first — for government and nonprofit work.",
    colors: [
      { name: "Navy", hex: "#1B3A5C" },
      { name: "Paper", hex: "#FFFFFF" },
      { name: "Teal", hex: "#0E7C7B" },
      { name: "Sand", hex: "#E8DCC8" },
    ],
    latinFamily: "Source Sans 3",
    arabicFamily: "Noto Sans Arabic",
    overview: "<h2>Clear enough to translate under pressure</h2><p>Every rule in this system optimizes for a reader who is stressed, on a bad connection, or reading a second language. Clever costs more than it earns here.</p>",
  },
];

export default function TemplatesPage() {
  const { state, hydrated, createWorkspace, addColor, setTypography, setOverview } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
  }, [hydrated, state.session, router]);

  if (!hydrated || !state.session) return null;

  function applyTemplate(t: Template) {
    const ws = createWorkspace(t.name);
    setOverview(ws.id, t.overview);
    setTypography(ws.id, { latinFamily: t.latinFamily, arabicFamily: t.arabicFamily });
    for (const c of t.colors) addColor(ws.id, { name: c.name, hex: c.hex });
    showToast(`Started "${t.name}" from a template.`, "success");
    router.push(`/w/${ws.slug}/overview`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 shrink-0 flex items-center gap-4 px-8" style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}>
        <Link href="/brands" className="mk-tap gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <Icon name="angle-left" size={14} />
          Brands
        </Link>
      </div>

      <div className="flex-1 px-8 py-8 flex flex-col gap-6 max-w-[1000px] w-full mx-auto">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            Template marketplace
          </h1>
          <p className="text-[14px] max-w-[62ch]" style={{ color: "var(--text-muted)" }}>
            Fork a starting system instead of a blank workspace. Each one seeds real colors, a font
            pairing and an overview draft you edit from there.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--surface-1)" }}>
              <div className="grid grid-cols-4">
                {t.colors.map((c) => (
                  <div key={c.name} className="h-[64px]" style={{ background: c.hex }} title={c.name} />
                ))}
              </div>
              <div className="p-5 flex flex-col gap-2.5 flex-1">
                <h2 className="font-semibold text-[16px]" style={{ fontFamily: "var(--font-display)" }}>{t.name}</h2>
                <p className="text-[13px] flex-1" style={{ color: "var(--text-muted)" }}>{t.tagline}</p>
                <div className="flex gap-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
                  <span className="px-2 py-1 rounded-full" style={{ background: "var(--surface-2)" }}>{t.latinFamily}</span>
                  <span className="px-2 py-1 rounded-full" style={{ background: "var(--surface-2)" }}>{t.arabicFamily}</span>
                </div>
                {/* Named for the template it starts. Four buttons all reading
                    "Use this template" are four identical choices to anything
                    that cannot see which card they are on. */}
                <button
                  type="button"
                  onClick={() => applyTemplate(t)}
                  aria-label={`Use the ${t.name} template`}
                  className="h-10 rounded-full text-[13px] font-semibold cursor-pointer mt-1"
                  style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
                >
                  Use this template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
