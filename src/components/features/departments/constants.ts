import type { DeptItemType, SectionKey } from "@/types";

export const PAGE_SECTION = { en: "Company departments", ar: "أقسام الشركة" } as const;

export const SECTION_META: Record<SectionKey, { label: string; icon: string; href: string }> = {
  overview: { label: "Overview", icon: "file-alt", href: "overview" },
  logo: { label: "Logo system", icon: "shapes", href: "visual-identity" },
  color: { label: "Color", icon: "palette", href: "visual-identity" },
  typography: { label: "Typography", icon: "font", href: "visual-identity" },
};

/** The kinds of item a department can link to, as the add form offers them. */
export const ITEM_TYPES: { value: DeptItemType; label: string }[] = [
  { value: "section", label: "Section" },
  { value: "purpose", label: "Purpose" },
  { value: "mission", label: "Mission" },
  { value: "persona", label: "Persona" },
  { value: "voiceTrait", label: "Voice trait" },
];

export type DepartmentMode = "edit" | "read";
