"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar, TopBarTab } from "@/components/layout";
import {
  BrandFilesContent,
  LogoSystemContent,
  ColorContent,
  TypographyContent,
  AssetTypeGrid,
} from "@/components/features/visual-identity";

type Tab = "files" | "logo" | "color" | "typography" | "patterns" | "graphics" | "illustrations" | "icons";

const TABS: { key: Tab; label: string; arLabel: string }[] = [
  { key: "files", label: "Brand files", arLabel: "ملفات الهوية" },
  { key: "logo", label: "Logo system", arLabel: "الشعار" },
  { key: "color", label: "Color", arLabel: "الألوان" },
  { key: "typography", label: "Typography", arLabel: "الخطوط" },
  { key: "patterns", label: "Patterns", arLabel: "الأنماط" },
  { key: "graphics", label: "Graphics", arLabel: "الرسومات" },
  { key: "illustrations", label: "Illustrations", arLabel: "الرسوم التوضيحية" },
  { key: "icons", label: "Icons", arLabel: "الأيقونات" },
];

export default function VisualIdentityPage() {
  const params = useParams<{ slug: string }>();
  const { getWorkspace } = useApp();
  const ws = getWorkspace(params.slug);
  const [tab, setTab] = useState<Tab>("files");

  if (!ws) return null;

  /**
   * Which tabs hold nothing yet.
   *
   * Four of these eight are asset grids that are empty in most workspaces, and
   * from the tab row they looked exactly like the four that are full. This is
   * the same count the Overview's Brand insights card reports, read from the
   * same fields, so the two cannot disagree.
   */
  const countOf = (type: string) => ws.assets.filter((a) => a.type === type).length;
  const emptyTabs: Record<Tab, boolean> = {
    files: ws.assets.length === 0,
    logo: Object.values(ws.logo).every((s) => s.phase !== "attached"),
    color: ws.colors.length === 0,
    typography: !ws.typography.latinFamily && !ws.typography.arabicFamily,
    patterns: countOf("pattern") === 0,
    graphics: countOf("graphic") === 0,
    illustrations: countOf("illustration") === 0,
    icons: countOf("icon") === 0,
  };

  const tabs: TopBarTab[] = TABS.map((t) => ({
    key: t.key,
    label: t.label,
    arLabel: t.arLabel,
    active: tab === t.key,
    empty: emptyTabs[t.key],
    onSelect: () => setTab(t.key),
  }));

  return (
    <>
      <TopBar workspace={ws} section="Visual identity" arSection="الهوية البصرية" tabs={tabs} />
      {tab === "files" && <BrandFilesContent ws={ws} onManageLogo={() => setTab("logo")} />}
      {tab === "logo" && <LogoSystemContent ws={ws} />}
      {tab === "color" && <ColorContent ws={ws} />}
      {tab === "typography" && <TypographyContent ws={ws} />}
      {tab === "patterns" && (
        <AssetTypeGrid
          ws={ws}
          type="pattern"
          title="Patterns"
          arTitle="الأنماط"
          hint="Repeatable surface patterns — backgrounds, textures, and tiled motifs."
        />
      )}
      {tab === "graphics" && (
        <AssetTypeGrid
          ws={ws}
          type="graphic"
          title="Graphics"
          arTitle="الرسومات"
          hint="Standalone graphic elements — badges, dividers, and decorative marks."
        />
      )}
      {tab === "illustrations" && (
        <AssetTypeGrid
          ws={ws}
          type="illustration"
          title="Illustrations"
          arTitle="الرسوم التوضيحية"
          hint="Custom illustration work — spot illustrations, characters, and scenes."
        />
      )}
      {tab === "icons" && (
        <AssetTypeGrid
          ws={ws}
          type="icon"
          title="Icons"
          arTitle="الأيقونات"
          hint="The icon set — UI glyphs and symbol marks, kept separate from the logo's own symbol slot."
        />
      )}
    </>
  );
}
