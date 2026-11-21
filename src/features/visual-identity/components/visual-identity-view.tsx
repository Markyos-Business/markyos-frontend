"use client";

import type { Workspace } from "@/types";
import { TypeLabView, useTypeLabPage } from "@/features/type-lab";
import { ASSET_TABS, type VisualIdentityTab } from "../constants";
import { AssetTypeGrid } from "./files/asset-type-grid";
import { ColorContent } from "./color/color-content";
import { LogoSystemContent } from "./logo/logo-system-content";
import { TypographyContent } from "./typography/typography-content";

type VisualIdentityViewProps = { ws: Workspace; tab: VisualIdentityTab };

/** The open tab's content. */
export function VisualIdentityView({ ws, tab }: VisualIdentityViewProps) {
  if (tab === "logo") return <LogoSystemContent ws={ws} />;
  if (tab === "color") return <ColorContent ws={ws} />;
  if (tab === "typography") return <TypographyContent ws={ws} />;
  if (tab === "type-lab") return <TypeLabTab slug={ws.slug} />;
  const grid = ASSET_TABS[tab];
  return grid ? <AssetTypeGrid ws={ws} {...grid} /> : null;
}

/** The type sandbox, as a tab: its own state lives in its hook, so it starts fresh each visit like the page did. */
function TypeLabTab({ slug }: { slug: string }) {
  const page = useTypeLabPage(slug);
  return page ? <TypeLabView {...page.view} /> : null;
}
