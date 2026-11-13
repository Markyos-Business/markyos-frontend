import type { WorkspaceStage } from "@/types";

export const STAGES: { key: WorkspaceStage; label: string; arLabel: string; hint: string; arHint: string }[] = [
  { key: "discovery", label: "Discovery", arLabel: "الاستكشاف", hint: "Brief out, listening", arHint: "الموجز أُرسل، مرحلة الاستماع" },
  { key: "strategy", label: "Strategy", arLabel: "الاستراتيجية", hint: "Positioning being written", arHint: "التموضع قيد الكتابة" },
  { key: "design", label: "Design", arLabel: "التصميم", hint: "Identity being made", arHint: "الهوية قيد التصميم" },
  { key: "review", label: "Review", arLabel: "المراجعة", hint: "With the client", arHint: "لدى العميل" },
  { key: "delivered", label: "Delivered", arLabel: "تم التسليم", hint: "Handed over", arHint: "سُلّمت" },
  { key: "live", label: "Live", arLabel: "منشور", hint: "In use, being governed", arHint: "قيد الاستخدام والحوكمة" },
];
