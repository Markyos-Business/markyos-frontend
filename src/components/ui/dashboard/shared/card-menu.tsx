"use client";
import { ActionsDropdown } from "../../button/actions-dropdown";
import { useDashboardLocale } from "./locale";
export interface CardMenuProps {
  onViewAll?: () => void;
  onExport?: () => void;
  onHide?: () => void;
  extraItems?: { label: string; icon: string; onClick: () => void }[];
  label?: string;
}
export default function CardMenu({ onViewAll, onExport, onHide, extraItems = [], label }: CardMenuProps) {
  const { t } = useDashboardLocale();
  const items = [
    ...(onViewAll ? [{ label: t("View all", "عرض الكل"), icon: "list-ul", onSelect: onViewAll }] : []),
    ...(onExport ? [{ label: t("Export", "تصدير"), icon: "file-export", onSelect: onExport }] : []),
    ...extraItems.map(({ onClick, ...item }) => ({ ...item, onSelect: onClick })),
    ...(onHide ? [{ label: t("Hide this card", "إخفاء البطاقة"), icon: "eye-slash", onSelect: onHide }] : []),
  ];
  return items.length ? <ActionsDropdown iconOnly label={label ?? t("Card options", "خيارات البطاقة")} items={items} /> : null;
}
