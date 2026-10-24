"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertBanner,
  Badge,
  Button,
  EmptyState,
  Icon,
  PageHeader,
  Table,
  TableEmptyRow,
  TableLoadingRow,
  TablePagination,
  Tabs,
  cellClasses,
  rowClasses,
} from "@/components/ui";
import { FilterSelectField, SearchField } from "@/components/form";
import { STATUS_META, STATUS_ORDER } from "../constants";
import { useForms } from "../hooks/useForms";
import { useTemplates } from "../hooks/useTemplates";
import type { FormListQuery, FormStatus, FormSummary } from "../types";
import { textIn } from "../model/questionTypes";
import { formatAgo } from "../utils/format";

const PAGE_SIZE = 25;

type FormsListViewProps = {
  /** Only this brand's forms, inside its workspace; the whole studio when absent. */
  brandId?: string;
  newFormHref: string;
  isAr: boolean;
};

/** Where a form opens, inside its brand: the builder while it's a draft, the answers once sent. */
const formHref = (form: FormSummary) => `/w/${form.workspaceSlug}/forms/${form.id}/${form.status === "draft" ? "edit" : "answers"}`;

/**
 * Every discovery form, by status: the studio's view of who has been asked
 * what, and who has answered.
 */
export function FormsListView({ brandId, newFormHref, isAr }: FormsListViewProps) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FormListQuery>({ status: "", ordering: "updated", page: 1, brand: brandId });
  const { data, error, loading, reload } = useForms(query);
  const templates = useTemplates();

  // Search waits for a pause in typing, and starts again from page one.
  useEffect(() => {
    const t = window.setTimeout(() => setQuery((q) => ({ ...q, search, page: 1 })), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const templateName = (key: string) => {
    if (!key) return isAr ? "من البداية" : "Blank";
    const template = templates.data?.find((t) => t.key === key);
    return template ? textIn(template.name, isAr ? "ar" : "en") : key;
  };

  const counts = data?.counts;
  const tab = (status: FormStatus | "") => {
    const label = status ? STATUS_META[status][isAr ? "ar" : "en"] : isAr ? "الكل" : "All";
    const n = counts ? counts[status || "all"] : null;
    return n == null ? label : `${label} ${n}`;
  };

  const columns = [
    { key: "form", label: isAr ? "النموذج" : "Form" },
    { key: "client", label: isAr ? "العميل · العلامة" : "Client · brand", className: "hidden md:table-cell" },
    { key: "template", label: isAr ? "القالب" : "Template", className: "hidden lg:table-cell" },
    { key: "languages", label: isAr ? "اللغات" : "Languages", className: "hidden lg:table-cell" },
    { key: "status", label: isAr ? "الحالة" : "Status" },
    { key: "answered", label: isAr ? "الإجابات" : "Answered", className: "hidden sm:table-cell" },
    { key: "activity", label: isAr ? "آخر نشاط" : "Last activity", className: "hidden md:table-cell" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isAr ? "نماذج الاستكشاف" : "Discovery forms"}
        description={
          isAr
            ? "استبيانات ثنائية اللغة يجيب عنها العميل بلا حساب، وتصل إجاباتها إلى العلامة."
            : "Bilingual questionnaires your client answers without an account. Answers land on the brand."
        }
        actions={
          <Button variant="primary" href={newFormHref} icon={<Icon name="plus" size={18} />}>
            {isAr ? "نموذج جديد" : "New form"}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-space-5">
        <Tabs
          label={isAr ? "حسب الحالة" : "By status"}
          tabs={(["", ...STATUS_ORDER] as (FormStatus | "")[]).map((status) => ({ key: status || "all", label: tab(status) }))}
          active={query.status || "all"}
          onChange={(key) => setQuery((q) => ({ ...q, status: key === "all" ? "" : (key as FormStatus), page: 1 }))}
        />
        <div className="flex flex-wrap items-center gap-space-5">
          <SearchField
            label={isAr ? "ابحث في النماذج" : "Search forms"}
            placeholder={isAr ? "ابحث بالاسم أو العميل…" : "Search by name or client…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FilterSelectField
            label={isAr ? "الترتيب" : "Sort"}
            hideLabel
            icon="arrows-v"
            value={query.ordering ?? "updated"}
            onChange={(e) => setQuery((q) => ({ ...q, ordering: e.target.value as FormListQuery["ordering"], page: 1 }))}
            options={[
              { value: "updated", label: isAr ? "آخر تعديل" : "Last edited" },
              { value: "created", label: isAr ? "الأحدث إنشاءً" : "Newest" },
              { value: "name", label: isAr ? "الاسم" : "Name A–Z" },
              { value: "status", label: isAr ? "الحالة" : "Status" },
            ]}
          />
        </div>
      </div>

      <AlertBanner message={error} />

      {data && data.counts.all === 0 && !query.search ? (
        <EmptyState
          icon="clipboard-list"
          title={isAr ? "لا توجد نماذج بعد" : "No forms yet"}
          description={
            isAr
              ? "ابدأ من قالب، أو اختر أسئلة من المكتبة، وأرسل الرابط لعميلك."
              : "Start from a template or pick questions from the library, then send your client the link."
          }
          action={
            <Button variant="primary" href={newFormHref} icon={<Icon name="plus" size={18} />}>
              {isAr ? "نموذج جديد" : "New form"}
            </Button>
          }
        />
      ) : (
        <Table
          label={isAr ? "نماذج الاستكشاف" : "Discovery forms"}
          columns={columns}
          footer={
            data && data.count > PAGE_SIZE ? (
              <TablePagination
                currentPage={query.page ?? 1}
                onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
                itemsPerPage={PAGE_SIZE}
                itemCount={data.results.length}
                totalCount={data.count}
                itemLabel={isAr ? "نماذج" : "forms"}
                loading={loading}
              />
            ) : null
          }
        >
          {loading && !data ? (
            <TableLoadingRow colSpan={columns.length} columns={columns.length} />
          ) : !data?.results.length ? (
            <TableEmptyRow
              colSpan={columns.length}
              title={isAr ? "لا نماذج تطابق البحث" : "No forms match"}
              description={isAr ? "جرّب بحثًا آخر أو حالة أخرى." : "Try another search or status."}
            />
          ) : (
            data.results.map((form) => {
              const status = STATUS_META[form.status];
              const share = form.total ? Math.round((form.answered / form.total) * 100) : 0;
              return (
                <tr key={form.id} className={rowClasses}>
                  <td className={cellClasses}>
                    <Link href={formHref(form)} className="mk-tap font-medium text-text hover:text-accent-text">
                      {form.name}
                    </Link>
                  </td>
                  <td className={`${cellClasses} hidden text-text-secondary md:table-cell`}>
                    {form.recipientName || "—"} · {form.workspaceName}
                  </td>
                  <td className={`${cellClasses} hidden text-text-secondary lg:table-cell`}>{templateName(form.templateKey)}</td>
                  <td className={`${cellClasses} hidden text-text-secondary lg:table-cell`}>
                    {/* The client's first language first. */}
                    {[form.primaryLanguage, ...form.languages.filter((l) => l !== form.primaryLanguage)].map((l) => l.toUpperCase()).join(" · ")}
                  </td>
                  <td className={cellClasses}>
                    <Badge tone={status.tone} dot>
                      {status[isAr ? "ar" : "en"]}
                    </Badge>
                  </td>
                  <td className={`${cellClasses} hidden sm:table-cell`}>
                    <div className="flex min-w-30 flex-col gap-space-2">
                      <span className="text-caption text-text-secondary tabular-nums">
                        {isAr ? `${form.answered} من ${form.total}` : `${form.answered} of ${form.total}`}
                      </span>
                      <span className="h-1 overflow-hidden rounded-full bg-ink-soft">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className={`${cellClasses} hidden text-caption font-medium text-text-muted md:table-cell`}>
                    {formatAgo(form.lastActivityAt, isAr)}
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      )}

      {error && (
        <div>
          <Button variant="outline" size="sm" onClick={reload}>
            {isAr ? "حاول مجددًا" : "Try again"}
          </Button>
        </div>
      )}
    </div>
  );
}
