"use client";

import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout";
import { AddDepartmentButton, DepartmentActions, DepartmentsView, useDepartmentsPage } from "@/components/features/departments";

export default function DepartmentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = useDepartmentsPage(slug);
  if (!page) return null;
  return (
    <PageShell
      {...page.shell}
      tabsRight={<AddDepartmentButton onAdd={page.onAdd} />}
      right={page.actions ? <DepartmentActions {...page.actions} /> : undefined}
    >
      <DepartmentsView {...page.view} />
    </PageShell>
  );
}
