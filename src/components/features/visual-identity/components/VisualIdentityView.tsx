"use client";

import type { Workspace } from "@/types";
import { ASSET_TABS, type VisualIdentityTab } from "../constants";
import { AssetTypeGrid } from "./AssetTypeGrid";
import { BrandFilesContent } from "./BrandFilesContent";
import { ColorContent } from "./ColorContent";
import { LogoSystemContent } from "./LogoSystemContent";
import { TypographyContent } from "./TypographyContent";

type VisualIdentityViewProps = { ws: Workspace; tab: VisualIdentityTab; onTab: (tab: VisualIdentityTab) => void };

/** The open tab's content. */
export function VisualIdentityView({ ws, tab, onTab }: VisualIdentityViewProps) {
  if (tab === "files") return <BrandFilesContent ws={ws} onManageLogo={() => onTab("logo")} />;
  if (tab === "logo") return <LogoSystemContent ws={ws} />;
  if (tab === "color") return <ColorContent ws={ws} />;
  if (tab === "typography") return <TypographyContent ws={ws} />;
  const grid = ASSET_TABS[tab];
  return grid ? <AssetTypeGrid ws={ws} {...grid} /> : null;
}
