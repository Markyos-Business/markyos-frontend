"use client";

// The "Studio" style offers three distinct, professional sub-styles rather
// than one fixed look (see Workspace.studioStyle) — this component just
// dispatches to whichever one the studio picked. Each sub-style is a full,
// independent template implementation, not a palette swap of the same shell.

import { StudioSignal } from "./studio/StudioSignal";
import { StudioAtlas } from "./studio/StudioAtlas";
import { StudioPrism } from "./studio/StudioPrism";
import { TemplateProps } from "../types";

export function StudioTemplate(props: TemplateProps) {
  switch (props.ws.studioStyle) {
    case "signal":
      return <StudioSignal {...props} />;
    case "atlas":
      return <StudioAtlas {...props} />;
    case "prism":
    default:
      return <StudioPrism {...props} />;
  }
}

StudioTemplate.displayName = "StudioTemplate";
