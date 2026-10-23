import type { CSSProperties } from "react";

/**
 * The design system's decisions, as style objects the shared section bodies
 * and the template shells can both apply.
 *
 * Everything here reads custom properties rather than fixed values, so one
 * component renders as a sharp shadowed panel under Signal and a soft filled
 * card under Atlas with no per-template branching. The properties themselves
 * are emitted by `themeCssVars` at each template's root.
 *
 * Worth knowing: these are plain objects, so spreading one and then setting a
 * property after it overrides that property — which is how a template opts out
 * of a single decision (a full-bleed band with no corners, say) without
 * opting out of the system.
 */

/** A content card — a persona, a voice trait, a department, a sign-off panel. */
export const gCard: CSSProperties = {
  background: "var(--g-card-bg)",
  boxShadow: "var(--g-card-shadow)",
  borderRadius: "var(--g-radius-lg)",
};

/**
 * A plate: the neutral ground brand artwork is presented on — logo tiles, icon
 * tiles, swatch cards, type specimens, mockup frames.
 *
 * Always filled and always edged, whatever the design system does with its
 * content cards. A transparent logo tile gives a reader nothing to judge
 * clearspace against, and a transparent swatch card makes a near-black swatch
 * vanish into a near-black page. Presenting artwork is this section's entire
 * job, so it keeps its ground.
 */
export const gPlate: CSSProperties = {
  background: "var(--g-plate-bg)",
  boxShadow: "var(--g-plate-shadow)",
  borderRadius: "var(--g-radius-lg)",
};

export const gPlateSm: CSSProperties = {
  background: "var(--g-plate-bg)",
  boxShadow: "var(--g-plate-shadow)",
  borderRadius: "var(--g-radius-md)",
};

/** A smaller card, or a control inside one. */
export const gCardSm: CSSProperties = {
  background: "var(--g-card-bg)",
  boxShadow: "var(--g-card-shadow)",
  borderRadius: "var(--g-radius-md)",
};

/**
 * An inset field or chip — always filled, even where cards are outlined,
 * because an input has to look like something you can type into.
 */
export const gInset: CSSProperties = {
  background: "var(--g-surface-2)",
  borderRadius: "var(--g-radius-md)",
};

/** Nav items and buttons. */
export const gPill: CSSProperties = {
  borderRadius: "var(--g-radius-pill)",
};

/** A section eyebrow: the small label above a heading. */
export const gLabel: CSSProperties = {
  fontSize: "var(--g-label-size)",
  letterSpacing: "var(--g-label-tracking)",
  textTransform: "var(--g-label-transform)" as CSSProperties["textTransform"],
  fontWeight: "var(--g-label-weight)" as CSSProperties["fontWeight"],
};

/** The hero headline. */
export const gHero: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--g-hero-size)",
  letterSpacing: "var(--g-hero-tracking)",
  fontWeight: "var(--g-hero-weight)" as CSSProperties["fontWeight"],
  lineHeight: 1.12,
};

/** A section heading, one step down from the hero. */
export const gSectionTitle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--g-section-size)",
  letterSpacing: "var(--g-hero-tracking)",
  fontWeight: "var(--g-hero-weight)" as CSSProperties["fontWeight"],
  lineHeight: 1.2,
};

/** Running body copy. */
export const gBody: CSSProperties = {
  fontSize: "var(--g-body-size)",
  lineHeight: "var(--g-lead)",
  color: "var(--g-text-muted)",
};
