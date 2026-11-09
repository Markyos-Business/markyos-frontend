import type { Workspace } from "@/types";
import { SECTION_META } from "../constants";

export type DeptItem = Workspace["departmentViews"][number]["items"][number];

/** What a linked item shows: read live from the brand, so editing Strategy updates it. */
export function resolveItem(ws: Workspace, item: DeptItem, isAr = false): { icon: string; title: string; body: string } {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  if (item.itemType === "section" && item.sectionKey) {
    const meta = SECTION_META[item.sectionKey];
    return { icon: meta.icon, title: isAr ? meta.arLabel : meta.label, body: t("Guideline section", "قسم من الدليل") };
  }
  if (item.itemType === "purpose") return { icon: "bullseye", title: t("Purpose", "الغاية"), body: ws.strategy.purpose || t("Not written yet.", "لم تُكتب بعد.") };
  if (item.itemType === "mission") return { icon: "bullseye", title: t("Mission", "الرسالة"), body: ws.strategy.mission || t("Not written yet.", "لم تُكتب بعد.") };
  if (item.itemType === "persona") {
    const p = ws.strategy.personas.find((x) => x.id === item.refId);
    return {
      icon: "users",
      title: p ? p.name : t("Persona (removed)", "شخصية (محذوفة)"),
      body: p ? `${p.role} — ${p.description}` : t("This persona no longer exists in Strategy.", "لم تعد هذه الشخصية موجودة في الاستراتيجية."),
    };
  }
  if (item.itemType === "voiceTrait") {
    const trait = ws.strategy.voiceTraits.find((x) => x.id === item.refId);
    return {
      icon: "quote-right",
      title: trait ? trait.trait : t("Voice trait (removed)", "سمة نبرة (محذوفة)"),
      body: trait ? trait.doExample : t("This voice trait no longer exists in Strategy.", "لم تعد سمة النبرة هذه موجودة في الاستراتيجية."),
    };
  }
  return { icon: "file-alt", title: "", body: "" };
}
