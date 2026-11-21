import { AppFooter, Button, EmptyState, Icon, PageHeader } from "@/components/ui";
import { DepartmentDocument } from "@/features/guideline-site";
import type { DepartmentsPageState } from "../hooks/use-departments-page";
import { PAGE_SECTION } from "../constants";
import { DepartmentPanel } from "./panel/department-panel";

/** The open department, edited or read — or, before there is one, how to add the first. */
export function DepartmentsView({ ws, isAr, active, mode, onAdd }: DepartmentsPageState["view"]) {
  return (
    <div className="flex min-h-0 max-w-[820px] flex-1 flex-col gap-5 overflow-auto px-7 py-6.5">
      {!active ? (
        <>
          <PageHeader title={isAr ? PAGE_SECTION.ar : PAGE_SECTION.en} description={isAr
                ? "صفحة تعريفية خاصة بكل قسم: محتوى دليله، مع عرض مصفّى للأقسام ومحتوى الاستراتيجية الذي يخصّه فعلًا."
                : "A department's own onboarding page — its guideline content, plus a filtered view into the sections and strategy content that actually apply to it."} />
          <EmptyState
            icon="sitemap"
            title={isAr ? "لا أقسام بعد." : "No departments yet."}
            description={isAr
              ? "أسماء الأقسام نص حر: الموارد البشرية، المبيعات، الشراكات، أو أي اسم تستخدمه مؤسستك."
              : "Name them the way your organisation does: HR, Sales, Partnerships, Executives."}
            action={<Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={onAdd}>{isAr ? "إضافة قسم" : "Add department"}</Button>}
          />
        </>
      ) : mode === "read" ? (
        <article className="flex flex-col gap-7">
          <PageHeader
            eyebrow={<><bdi>{ws.name}</bdi>{isAr ? " · تعليمات القسم" : " · department instructions"}</>}
            title={active.name}
          />
          <DepartmentDocument ws={ws} view={active} isAr={isAr} />
        </article>
      ) : (
        <DepartmentPanel key={active.id} ws={ws} viewId={active.id} />
      )}
      <AppFooter lang={isAr ? "ar" : "en"} className="mt-auto" />
    </div>
  );
}
