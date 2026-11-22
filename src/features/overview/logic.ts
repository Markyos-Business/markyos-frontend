import type { AccountType, PathStepKey } from "@/types";
import type { AttentionItem, Glance, MainActionKey, OverviewData, OverviewRole, StepState } from "./types";

/*
 * The Overview's plain rules on the client side: where each step, action and
 * attention item leads, which version a brand gets, and which blocks have
 * something to show. The step states, stage, main action, attention order
 * and role filter are worked out on the server (apps/brands/overview.py);
 * these only turn its keys into places.
 */

export const STEP_ORDER: PathStepKey[] = ["discover", "analyse", "strategy", "direction", "identity", "kit", "guide", "handoff"];

const base = (slug: string) => `/w/${slug}`;

/** Each step's own page. */
export function stepHref(slug: string, step: PathStepKey): string {
  const b = base(slug);
  switch (step) {
    case "discover":
      return `${b}/discovery`;
    case "analyse":
      return `${b}/discovery?tab=analysis`;
    case "strategy":
      return `${b}/strategy/positioning`;
    case "direction":
      return `${b}/moodboard`;
    case "identity":
      return `${b}/visual-identity`;
    case "kit":
      return `${b}/assets`;
    case "guide":
      return `${b}/builder`;
    case "handoff":
      return `${b}/team`;
  }
}

/** Where the main action goes; `hand_off` is a confirmation, not a page. */
export function actionHref(slug: string, action: MainActionKey, siteUrl: string): string | null {
  const b = base(slug);
  switch (action) {
    case "send_form":
    case "read_answers":
      return `${b}/discovery`;
    case "review_drafts":
      return `${b}/drafts`;
    case "run_analysis":
      return `${b}/discovery?tab=analysis`;
    case "write_strategy":
      return `${b}/strategy/positioning`;
    case "build_guide":
      return `${b}/builder`;
    case "open_guide":
      return siteUrl;
    case "hand_off":
      return null;
  }
}

/** Where an attention item is dealt with. */
export function attentionHref(slug: string, item: AttentionItem): string {
  const b = base(slug);
  switch (item.type) {
    case "form_answered":
      return `${b}/discovery`;
    case "drafts_waiting":
      return `${b}/drafts`;
    case "signoff_pending":
    case "approval_waiting":
      return `${b}/team`;
    case "link_expiring":
      return `${b}/discovery?tab=analysis`;
  }
}

/** Studio and freelancer brands get the project overview; a company's own brand gets its brand home. */
export const versionOf = (type: AccountType | undefined): "project" | "home" => (type === "company" ? "home" : "project");

export const canEditRole = (role: OverviewRole) => role === "owner" || role === "editor";

/** The guideline site's address: the verified custom domain, else /v/<slug> on this app. */
export const siteUrl = (site: OverviewData["site"], origin: string) => (site.domain ? `https://${site.domain}` : `${origin}${site.path}`);

/** A step's state as a shape, so it never depends on colour alone. */
export const STEP_ICON: Record<StepState, string> = {
  done: "check-circle",
  in_progress: "adjust",
  skipped: "minus-circle",
  not_started: "circle",
};

/** A bilingual value in the reader's language, falling back to the other. */
export const pick = (v: { en: string; ar: string }, isAr: boolean) => (isAr ? v.ar || v.en : v.en || v.ar);

/** Which "brand so far" slots have data. Empty ones say where they come from. */
export function glanceSlots(g: Glance | null) {
  return {
    positioning: !!(g && (g.positioning.en || g.positioning.ar)),
    voice: !!g?.voice.length,
    audience: !!(g && (g.audience.en || g.audience.ar || g.audience.personas)),
    colors: !!g?.colors.length,
    logos: !!g?.logos.length,
    typefaces: !!(g && (g.typefaces.latin || g.typefaces.arabic)),
  };
}

/** A brand with nothing started yet: only the header, the path or quick actions, and the main action. */
export function isNewBrand(data: OverviewData): boolean {
  const steps = data.steps ?? [];
  const started = steps.some((s) => s.state !== "not_started");
  // A block that failed can't say it's empty: show the blocks, with its error.
  return !started && !data.errors?.length && !data.attention?.length && !data.activity?.length && !data.site.published;
}
