"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/features/shell";
import { AddDepartmentButton, DepartmentActions, DepartmentsView, useDepartmentsPage } from "@/features/departments";

export default function DepartmentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useDepartmentsPage(slug);
  if (!page) return null;
  return (
    <PageShell
      {...page.shell}
      tabsRight={<AddDepartmentButton onAdd={page.onAdd} isAr={page.view.isAr} />}
      right={page.actions ? <DepartmentActions {...page.actions} /> : undefined}
    >
      <DepartmentsView {...page.view} />
    </PageShell>
  );
}
