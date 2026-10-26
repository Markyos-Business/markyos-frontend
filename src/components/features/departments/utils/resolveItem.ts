import type { Workspace } from "@/types";
import { SECTION_META } from "../constants";

export type DeptItem = Workspace["departmentViews"][number]["items"][number];

/** What a linked item shows: read live from the brand, so editing Strategy updates it. */
export function resolveItem(ws: Workspace, item: DeptItem): { icon: string; title: string; body: string } {
  if (item.itemType === "section" && item.sectionKey) {
    return { icon: SECTION_META[item.sectionKey].icon, title: SECTION_META[item.sectionKey].label, body: "Guideline section" };
  }
  if (item.itemType === "purpose") return { icon: "bullseye", title: "Purpose", body: ws.strategy.purpose || "Not written yet." };
  if (item.itemType === "mission") return { icon: "bullseye", title: "Mission", body: ws.strategy.mission || "Not written yet." };
  if (item.itemType === "persona") {
    const p = ws.strategy.personas.find((x) => x.id === item.refId);
    return {
      icon: "users",
      title: p ? p.name : "Persona (removed)",
      body: p ? `${p.role} — ${p.description}` : "This persona no longer exists in Strategy.",
    };
  }
  if (item.itemType === "voiceTrait") {
    const t = ws.strategy.voiceTraits.find((x) => x.id === item.refId);
    return {
      icon: "quote-right",
      title: t ? t.trait : "Voice trait (removed)",
      body: t ? t.doExample : "This voice trait no longer exists in Strategy.",
    };
  }
  return { icon: "file-alt", title: "", body: "" };
}
