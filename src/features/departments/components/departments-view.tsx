import { Button, EmptyHint } from "@/components/ui";
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
          <div>
            <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? PAGE_SECTION.ar : PAGE_SECTION.en}</h1>
            <p className="max-w-[62ch] text-[14px] text-text-muted">
              {isAr
                ? "صفحة تعريفية خاصة بكل قسم: محتوى دليله، مع عرض مصفّى للأقسام ومحتوى الاستراتيجية الذي يخصّه فعلًا."
                : "A department's own onboarding page — its guideline content, plus a filtered view into the sections and strategy content that actually apply to it."}
            </p>
          </div>
          <EmptyHint>
            {isAr
              ? "لا أقسام بعد. أسماء الأقسام نص حر: الموارد البشرية، المبيعات، الشراكات، الإدارة التنفيذية، أو أي اسم تستخدمه مؤسستك."
              : "No departments yet. Department names are free text — HR, Sales, Partnerships, Executives, whatever your org actually calls them."}
          </EmptyHint>
          <Button variant="solid" size="sm" onClick={onAdd} className="self-start">
            {isAr ? "إضافة قسم" : "Add department"}
          </Button>
        </>
      ) : mode === "read" ? (
        <article className="flex flex-col gap-7">
          <header className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-[.12em] text-text-faint uppercase">
              {isAr ? `${ws.name} · تعليمات القسم` : `${ws.name} · department instructions`}
            </span>
            <h1 dir="auto" className="bidi-auto font-display text-[34px] leading-[1.15] font-semibold tracking-tight">
              {active.name}
            </h1>
          </header>
          <DepartmentDocument ws={ws} view={active} isAr={isAr} />
        </article>
      ) : (
        <DepartmentPanel key={active.id} ws={ws} viewId={active.id} />
      )}
    </div>
  );
}
