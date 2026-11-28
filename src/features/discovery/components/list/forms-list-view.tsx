"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUrlTab } from "@/hooks/useUrlTab";
import {
  ActionsDropdown,
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
  TabPanel,
  useTabIds,
  cellClasses,
  rowClasses,
  useDialog,
  useToast,
} from "@/components/ui";
import { errorText } from "@/lib/api/errorText";
import { deleteForm, duplicateForm } from "../../api/discovery.api";
import { SearchField, SortControl } from "@/components/ui";
import { STATUS_META, STATUS_ORDER } from "../../constants";
import { useForms } from "../../hooks/use-forms";
import { useTemplates } from "../../hooks/use-templates";
import type { FormListQuery, FormStatus, FormSummary } from "../../types";
import { textIn } from "../../utils/question-types";
import { formatAgo } from "../../utils/format";

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
const STATUS_TABS = ["all", ...STATUS_ORDER] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export function FormsListView({ brandId, newFormHref, isAr }: FormsListViewProps) {
  const tabIds = useTabIds();
  const [search, setSearch] = useState("");
  // The status tab lives in the URL (`?tab=`), so a link opens on it and Back returns.
  const [statusTab, setStatusTab] = useUrlTab(STATUS_TABS, "all");
  const [state, setQuery] = useState<FormListQuery>({ status: "", ordering: "updated", page: 1, brand: brandId });
  const query: FormListQuery = { ...state, status: statusTab === "all" ? "" : statusTab };
  const { data, error, loading, reload } = useForms(query);
  const templates = useTemplates();
  const router = useRouter();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const failed = (err: unknown) => showToast(errorText(err, isAr ? "ar" : "en", { en: "That didn't work. Try again.", ar: "لم ينجح ذلك. حاول مرة أخرى." }), "danger");

  /** A new draft with the same questions, never the answers or the link; opened in the builder. */
  async function duplicate(form: FormSummary) {
    setBusyId(form.id);
    try {
      const copy = await duplicateForm(form.id);
      showToast(t(`Duplicated as "${copy.name}".`, `نُسخ باسم «${copy.name}».`), "success");
      router.push(`/w/${form.workspaceSlug}/forms/${copy.id}/edit`);
    } catch (err) {
      failed(err);
    } finally {
      setBusyId(null);
    }
  }

  /** Drafts only: a sent questionnaire keeps its answers (the server refuses too). */
  async function remove(form: FormSummary) {
    const ok = await confirm({
      title: t("Delete this questionnaire?", "حذف هذا الاستبيان؟"),
      body: t(`"${form.name}" and its questions are deleted. It was never sent, so no answers are lost.`, `سيُحذف «${form.name}» وأسئلته. لم يُرسل قط، فلن تضيع أي إجابات.`),
      confirmLabel: t("Delete", "حذف"),
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    setBusyId(form.id);
    try {
      await deleteForm(form.id);
      showToast(t(`"${form.name}" deleted.`, `حُذف «${form.name}».`), "success");
      reload();
    } catch (err) {
      failed(err);
    } finally {
      setBusyId(null);
    }
  }

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
    { key: "form", label: isAr ? "الاستبيان" : "Questionnaire" },
    { key: "client", label: isAr ? "العميل · العلامة" : "Client · brand", className: "hidden md:table-cell" },
    { key: "template", label: isAr ? "القالب" : "Template", className: "hidden lg:table-cell" },
    { key: "languages", label: isAr ? "اللغات" : "Languages", className: "hidden lg:table-cell" },
    { key: "status", label: isAr ? "الحالة" : "Status" },
    { key: "answered", label: isAr ? "الإجابات" : "Answered", className: "hidden sm:table-cell" },
    { key: "activity", label: isAr ? "آخر نشاط" : "Last activity", className: "hidden md:table-cell" },
    // The row's one ⋯ menu (MARKYOS_UI §6.15): at the row's end, named for the questionnaire.
    { key: "actions", label: <span className="sr-only">{isAr ? "الإجراءات" : "Actions"}</span>, className: "w-12" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isAr ? "استبيانات الاستكشاف" : "Discovery questionnaires"}
        description={
          isAr
            ? "استبيانات ثنائية اللغة يجيب عنها العميل بلا حساب، وتصل إجاباتها إلى العلامة."
            : "Bilingual questionnaires your client answers without an account. Answers land on the brand."
        }
        actions={
          <Button variant="primary" href={newFormHref} icon={<Icon name="plus" size={18} />}>
            {isAr ? "استبيان جديد" : "New questionnaire"}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-ctl-row">
        <Tabs {...tabIds}
          label={isAr ? "حسب الحالة" : "By status"}
          tabs={(["", ...STATUS_ORDER] as (FormStatus | "")[]).map((status) => ({ key: status || "all", label: tab(status) }))}
          active={query.status || "all"}
          onChange={(key) => { setStatusTab(key as StatusTab); setQuery((q) => ({ ...q, page: 1 })); }}
        />
        <div className="flex flex-wrap items-center gap-ctl-row">
          <SearchField
            label={isAr ? "ابحث في الاستبيانات" : "Search questionnaires"}
            placeholder={isAr ? "ابحث بالاسم أو العميل…" : "Search by name or client…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SortControl
            label={isAr ? "ترتيب الاستبيانات" : "Sort questionnaires"}
            hideLabel
            defaultLabel={isAr ? "آخر تعديل أولًا" : "Last edited first"}
            value={query.ordering === "updated" ? "" : query.ordering ?? ""}
            onChange={(value) => setQuery((q) => ({ ...q, ordering: (value || "updated") as FormListQuery["ordering"], page: 1 }))}
            options={[
              { value: "created", label: isAr ? "الأحدث إنشاءً أولًا" : "Newest first" },
              { value: "name", label: isAr ? "الاسم (أ–ي)" : "Name A–Z" },
              { value: "status", label: isAr ? "حسب الحالة" : "By status" },
            ]}
          />
        </div>
      </div>

      <TabPanel id={tabIds.panelId} tabsId={tabIds.id} active={query.status || "all"} className="flex min-w-0 flex-col gap-5">
      <AlertBanner message={error} />

      {data && data.counts.all === 0 && !query.search ? (
        <EmptyState
          icon="clipboard-list"
          title={isAr ? "لا توجد استبيانات بعد" : "No questionnaires yet"}
          description={
            isAr
              ? "ابدأ من قالب، أو اختر أسئلة من المكتبة، وأرسل الرابط لعميلك."
              : "Start from a template or pick questions from the library, then send your client the link."
          }
          action={
            <Button variant="primary" href={newFormHref} icon={<Icon name="plus" size={18} />}>
              {isAr ? "استبيان جديد" : "New questionnaire"}
            </Button>
          }
        />
      ) : (
        <Table
          label={isAr ? "استبيانات الاستكشاف" : "Discovery questionnaires"}
          columns={columns}
          footer={
            data && data.count > PAGE_SIZE ? (
              <TablePagination
                currentPage={query.page ?? 1}
                onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
                itemsPerPage={PAGE_SIZE}
                itemCount={data.results.length}
                totalCount={data.count}
                itemLabel={isAr ? "استبيانات" : "questionnaires"}
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
              title={isAr ? "لا استبيانات تطابق البحث" : "No questionnaires match"}
              description={isAr ? "جرّب بحثًا آخر أو حالة أخرى." : "Try another search or status."}
            />
          ) : (
            data.results.map((form) => {
              const status = STATUS_META[form.status];
              const share = form.total ? Math.round((form.answered / form.total) * 100) : 0;
              return (
                <tr key={form.id} className={rowClasses}>
                  <td className={cellClasses}>
                    <Link /* button-audit-ignore: the form's name, a text link in its table row */ href={formHref(form)} className="mk-tap font-medium text-text hover:text-accent-text">
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
                  <td className={`${cellClasses} text-end`}>
                    <ActionsDropdown
                      iconOnly
                      size="sm"
                      align="end"
                      label={t(`${form.name} actions`, `إجراءات ${form.name}`)}
                      items={[
                        { label: t("Duplicate", "إنشاء نسخة"), icon: "copy", onSelect: () => void duplicate(form), disabled: busyId === form.id },
                        {
                          label: t("Delete", "حذف"),
                          icon: "trash",
                          tone: "danger",
                          onSelect: () => void remove(form),
                          disabled: form.status !== "draft" || busyId === form.id,
                          reason: form.status !== "draft" ? t("A sent questionnaire keeps its answers, so it can't be deleted.", "الاستبيان المُرسل يحتفظ بإجاباته، لذا لا يمكن حذفه.") : undefined,
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </Table>
      )}

      {error && (
        <div>
          <Button variant="secondary" size="sm" onClick={reload}>
            {isAr ? "حاول مجددًا" : "Try again"}
          </Button>
        </div>
      )}
      </TabPanel>
    </div>
  );
}
