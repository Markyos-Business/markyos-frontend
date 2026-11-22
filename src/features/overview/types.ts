import type { AccountType, PathStepKey } from "@/types";

/** What GET /brands/<id>/overview/ returns (apps/brands/overview.py). */

export type StepState = "done" | "in_progress" | "skipped" | "not_started";
export type OverviewRole = "owner" | "editor" | "viewer" | "client";
export type MainActionKey =
  | "send_form"
  | "read_answers"
  | "review_drafts"
  | "run_analysis"
  | "write_strategy"
  | "build_guide"
  | "hand_off"
  | "open_guide";
export type AttentionType = "form_answered" | "drafts_waiting" | "signoff_pending" | "approval_waiting" | "link_expiring";
export type ActivityType =
  | "form_sent"
  | "form_answered"
  | "analysis_ready"
  | "draft_proposed"
  | "draft_accepted"
  | "draft_rejected"
  | "signoff_note"
  | "signoff_resolved"
  | "approval_proposed"
  | "approval_approved"
  | "approval_rejected"
  | "call_note"
  | "link_created"
  | "link_revoked"
  | "version_saved"
  | "published"
  | "direction_chosen"
  | "handed_off";

export type Bilingual = { en: string; ar: string };

export type Glance = {
  tagline: Bilingual;
  positioning: Bilingual;
  voice: Bilingual[];
  audience: Bilingual & { personas: number };
  colors: { name: string; hex: string; primary: boolean }[];
  logos: { slot: string; url: string }[];
  typefaces: { latin: string; arabic: string };
};

export type OverviewStep = { key: PathStepKey; state: StepState };
export type AttentionItem = { type: AttentionType; at: number | null; count?: number; ref?: string; title?: string; by?: string };
export type ActivityEvent = { type: ActivityType; at: number; title: string; by: string };
export type Person = { name: string; email: string; role: OverviewRole };
export type SharedLink = { id: string; label: string; scope: "strategy" | "department"; createdAt: number | null };

export type OverviewData = {
  workspaceType: AccountType;
  role: OverviewRole;
  demo: boolean;
  trimmed: boolean;
  header: { name: string; initials: string; logo: string; tagline: Bilingual };
  site: { published: boolean; live: boolean; publishedAt: number | null; path: string; domain: string };
  glance: Glance | null;
  steps?: OverviewStep[];
  stage?: PathStepKey | null;
  mainAction?: MainActionKey | null;
  attention?: AttentionItem[];
  people?: Person[];
  contact?: { name: string; email: string; source: "team" | "form" } | null;
  shareLinks?: SharedLink[];
  activity?: ActivityEvent[];
  counts?: { draftsWaiting: number };
};
