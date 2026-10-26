import type { WorkspaceStage } from "@/types";

export const STAGES: { key: WorkspaceStage; label: string; arLabel: string; hint: string }[] = [
  { key: "discovery", label: "Discovery", arLabel: "الاستكشاف", hint: "Brief out, listening" },
  { key: "strategy", label: "Strategy", arLabel: "الاستراتيجية", hint: "Positioning being written" },
  { key: "design", label: "Design", arLabel: "التصميم", hint: "Identity being made" },
  { key: "review", label: "Review", arLabel: "المراجعة", hint: "With the client" },
  { key: "delivered", label: "Delivered", arLabel: "تم التسليم", hint: "Handed over" },
  { key: "live", label: "Live", arLabel: "منشور", hint: "In use, being governed" },
];
