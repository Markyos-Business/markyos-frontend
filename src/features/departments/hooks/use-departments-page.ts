"use client";

import { useState } from "react";
import { useUrlTab } from "@/hooks/useUrlTab";
import { useAppActions } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { useDialog } from "@/components/ui";
import type { TopBarTab } from "@/features/shell";
import { PAGE_SECTION, type DepartmentMode } from "../constants";

/** The departments page: which department is open, edit or read, and adding one. */
export function useDepartmentsPage(slug: string) {
  const { addDepartmentView } = useAppActions();
  const { prompt } = useDialog();
  const page = useBrandPage(slug);
  const sorted = page ? [...page.workspace.departmentViews].sort((a, b) => a.createdAt - b.createdAt) : [];
  // `?tab=<department id>`: a link opens that department, and Back returns to the last one.
  const [activeId, setActiveId] = useUrlTab(sorted.map((d) => d.id), sorted[0]?.id ?? "");
  const [mode, setMode] = useState<DepartmentMode>("edit");
  if (!page) return null;
  const { workspace: ws, isAr } = page;
  const active = sorted.find((d) => d.id === activeId) ?? sorted[0];

  async function add() {
    const name = await prompt({
      title: isAr ? "قسم جديد" : "New department",
      label: isAr ? "اسم القسم" : "Department name",
      placeholder: isAr ? "المبيعات" : "Sales",
      hint: isAr ? "القسم يحصل على صفحة إرشادات خاصة به." : "Each department gets its own guideline page.",
      confirmLabel: isAr ? "إنشاء" : "Create",
      isAr,
    });
    if (!name) return;
    const id = addDepartmentView(ws.id, name);
    if (id) setActiveId(id);
  }

  const tabs: TopBarTab[] = sorted.map((d) => ({
    key: d.id,
    label: d.name,
    arLabel: d.name,
    active: active?.id === d.id,
    onSelect: () => setActiveId(d.id),
  }));

  const onAdd = () => void add();
  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, tabs, width: "full" as const },
    onAdd,
    actions: active ? { ws, isAr, departmentId: active.id, mode, onMode: setMode } : null,
    view: { ws, isAr, active, mode, onAdd },
  };
}

export type DepartmentsPageState = NonNullable<ReturnType<typeof useDepartmentsPage>>;
