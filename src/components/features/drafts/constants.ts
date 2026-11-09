import type { DraftSource, DraftStatus } from "@/types";

export const PAGE_SECTION = { en: "Drafts", ar: "المسودات" } as const;

export const SOURCE_META: Record<DraftSource, { label: string; arLabel: string; icon: string }> = {
  brief: { label: "Discovery questionnaire", arLabel: "استبيان الاستكشاف", icon: "clipboard-list" },
  ai: { label: "AI", arLabel: "ذكاء اصطناعي", icon: "robot" },
  ingestion: { label: "Import", arLabel: "استيراد", icon: "file-import" },
  palette: { label: "Palette", arLabel: "لوحة الألوان", icon: "palette" },
};

/** Human names for the strategy fields a draft can target, in Arabic. */
export const AR_FIELD_LABEL: Record<string, string> = {
  purpose: "الغاية",
  mission: "الرسالة",
  vision: "الرؤية",
  targetAudienceSummary: "الجمهور المستهدف",
  positioningStatement: "تموضع العلامة",
  uvp: "عرض القيمة الفريد",
  purposeAr: "الغاية (بالعربية)",
  missionAr: "الرسالة (بالعربية)",
  visionAr: "الرؤية (بالعربية)",
  targetAudienceSummaryAr: "الجمهور المستهدف (بالعربية)",
  positioningStatementAr: "تموضع العلامة (بالعربية)",
  uvpAr: "عرض القيمة الفريد (بالعربية)",
};

/** A draft's decision, as read. */
export const STATUS_LABEL: Record<DraftStatus, { en: string; ar: string }> = {
  pending: { en: "Waiting", ar: "بانتظار القرار" },
  accepted: { en: "Accepted", ar: "مقبولة" },
  rejected: { en: "Rejected", ar: "مرفوضة" },
  superseded: { en: "Superseded", ar: "مستبدلة" },
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
