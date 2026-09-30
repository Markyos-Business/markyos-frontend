/**
 * Which piece of logo artwork a surface should draw, and which file to use
 * once the ground behind it is dark.
 *
 * The choice used to be written out at each call site as a nested ternary over
 * `attachedSlots`, once per template. Centralising it means the nav bars, the
 * heroes and the slide deck all resolve the same lockup, and all of them pick
 * up an uploaded light version the moment one exists.
 */

import { LogoSlot, SlotKind, Workspace } from "@/lib/types";

export interface MarkSources {
  /** The main artwork, in the colours it was uploaded in. */
  src?: string;
  /** The brand's own light version, when it supplied one. */
  lightSrc?: string;
}

export function markSources(slot: LogoSlot | undefined): MarkSources {
  if (!slot || slot.phase !== "attached") return {};
  return { src: slot.url, lightSrc: slot.lightUrl };
}

const SLOT_ORDER: SlotKind[] = ["symbol", "latin", "arabic"];

/**
 * The artwork for a small badge — an app icon, a social avatar, a favicon —
 * where only a symbol works at that size.
 */
export function navMarkSlot(ws: Workspace): LogoSlot | undefined {
  for (const kind of SLOT_ORDER) {
    if (ws.logo[kind]?.phase === "attached") return ws.logo[kind];
  }
  return undefined;
}

export function navMark(ws: Workspace): MarkSources {
  return markSources(navMarkSlot(ws));
}

export interface NavLogo extends MarkSources {
  /**
   * True when the artwork is a full lockup — it already contains the brand
   * name, so the nav must not also print the name as text beside it.
   */
  isLockup: boolean;
}

/**
 * What a guideline site's nav bar should show.
 *
 * A brand's nav carries its logo, not its initials-in-a-circle next to a
 * typed-out name: the lockup *is* how the brand writes its own name, and
 * setting it in the interface font beside a symbol overrides that. So the
 * script's own lockup wins, then the other script's, and only when neither
 * exists does it fall back to the symbol plus the name as text.
 */
export function navLogo(ws: Workspace, isAr: boolean): NavLogo {
  const preferred: SlotKind[] = isAr ? ["arabic", "latin"] : ["latin", "arabic"];
  for (const kind of preferred) {
    const slot = ws.logo[kind];
    if (slot?.phase === "attached" && slot.url) return { ...markSources(slot), isLockup: true };
  }
  return { ...markSources(ws.logo.symbol), isLockup: false };
}

/** Whether this slot has a light version the studio uploaded itself. */
export function hasLightVersion(slot: LogoSlot | undefined): boolean {
  return !!slot?.lightUrl;
}
