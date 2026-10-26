import type { DraftSource, DraftStatus } from "@/types";

export const PAGE_SECTION = { en: "Drafts", ar: "المسودات" } as const;

export const SOURCE_META: Record<DraftSource, { label: string; arLabel: string; icon: string }> = {
  brief: { label: "Discovery form", arLabel: "نموذج الاستكشاف", icon: "clipboard-list" },
  ai: { label: "AI", arLabel: "ذكاء اصطناعي", icon: "robot" },
  ingestion: { label: "Import", arLabel: "استيراد", icon: "file-import" },
  palette: { label: "Palette", arLabel: "لوحة الألوان", icon: "palette" },
};

/** Human names for the strategy fields a draft can target. */
export const FIELD_LABEL: Record<string, string> = {
  purpose: "Purpose",
  mission: "Mission",
  vision: "Vision",
  targetAudienceSummary: "Target audience",
  positioningStatement: "Brand positioning",
  uvp: "Unique value proposition",
  purposeAr: "Purpose (Arabic)",
  missionAr: "Mission (Arabic)",
  visionAr: "Vision (Arabic)",
  targetAudienceSummaryAr: "Target audience (Arabic)",
  positioningStatementAr: "Brand positioning (Arabic)",
  uvpAr: "Unique value proposition (Arabic)",
};

export const STATUS_TONE: Record<DraftStatus, "accent" | "success" | "neutral" | "warning"> = {
  pending: "accent",
  accepted: "success",
  rejected: "neutral",
  superseded: "neutral",
};
