import type { DeptItemType, SectionKey } from "@/types";

export const PAGE_SECTION = { en: "Company departments", ar: "أقسام الشركة" } as const;

export const SECTION_META: Record<SectionKey, { label: string; arLabel: string; icon: string; href: string }> = {
  overview: { label: "Overview", arLabel: "نظرة عامة", icon: "file-alt", href: "overview" },
  logo: { label: "Logo system", arLabel: "نظام الشعار", icon: "shapes", href: "visual-identity" },
  color: { label: "Color", arLabel: "الألوان", icon: "palette", href: "visual-identity" },
  typography: { label: "Typography", arLabel: "الخطوط", icon: "font", href: "visual-identity" },
};

/** The kinds of item a department can link to, as the add form offers them. */
export const ITEM_TYPES: { value: DeptItemType; label: string; arLabel: string }[] = [
  { value: "section", label: "Section", arLabel: "قسم" },
  { value: "purpose", label: "Purpose", arLabel: "الغاية" },
  { value: "mission", label: "Mission", arLabel: "الرسالة" },
  { value: "persona", label: "Persona", arLabel: "شخصية" },
  { value: "voiceTrait", label: "Voice trait", arLabel: "سمة نبرة" },
];

export type DepartmentMode = "edit" | "read";
