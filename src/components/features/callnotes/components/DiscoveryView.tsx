"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionsDropdown, AlertBanner, Avatar, Badge, Button, EmptyState, Icon, IconBadge, PageHeader, Skeleton, Tabs, useDialog, useToast } from "@/components/ui";
import { STATUS_META, formatDay } from "@/components/features/discovery";
import { KIND_META, LANGUAGE_META } from "../constants";
import { useDiscoveryFeed } from "../hooks/useDiscoveryFeed";
import { deleteNote, setIncluded } from "../services/callNotesService";
import type { FeedCall, FeedForm } from "../types";
import { callDay, initials } from "../utils/format";

type Tab = "all" | "forms" | "calls";

type DiscoveryViewProps = {
  brandId: string;
  brandSlug: string;
  isAr: boolean;
};

const base = (slug: string) => `/w/${slug}/discovery`;
export const callHref = (slug: string, id: string) => `${base(slug)}/calls/${id}`;
const formHref = (slug: string, form: FeedForm) => `/w/${slug}/forms/${form.id}/${form.status === "draft" ? "edit" : "answers"}`;

/**
 * Everything the client has told the studio, in one place: form answers and
 * call notes on a single timeline, newest first.
 */
export function DiscoveryView({ brandId, brandSlug, isAr }: DiscoveryViewProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { data, error, loading, reload } = useDiscoveryFeed(brandId);
  const [tab, setTab] = useState<Tab>("all");
  const items = data?.items ?? [];
  const forms = items.filter((i): i is FeedForm => i.type === "form");
  const calls = items.filter((i): i is FeedCall => i.type === "call");
  const shown = tab === "forms" ? forms : tab === "calls" ? calls : items;
  const addHref = `${base(brandSlug)}/calls/new`;
  const canEdit = data?.canEdit ?? false;

  const addButton = canEdit && (
    <Button variant="primary" href={addHref} icon={<Icon name="plus" size={18} />}>
      {t("Add call notes", "إضافة ملاحظات مكالمة")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("Discovery", "الاستكشاف")}
        description={t(
          "What the client told you, typed in a form or said on a call. The analysis reads both.",
          "ما قاله العميل، كتابةً في نموذج أو حديثًا في مكالمة. يقرأ التحليل كليهما."
        )}
        actions={
          <div className="flex flex-wrap items-center gap-space-3">
            <Button variant="outline" href={`/w/${brandSlug}/forms`} icon={<Icon name="clipboard-list" size={18} />}>
              {t("Forms", "النماذج")}
            </Button>
            {addButton}
          </div>
        }
      />

      <AlertBanner message={error} />

      <section className="mk-surface flex flex-col rounded-card bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-space-5 px-space-8 pt-space-8 pb-space-5">
          <Tabs
            label={t("Show", "عرض")}
            tabs={[
              { key: "all", label: `${t("All", "الكل")} ${items.length}` },
              { key: "forms", label: `${t("Form answers", "إجابات النماذج")} ${forms.length}` },
              { key: "calls", label: `${t("Call notes", "ملاحظات المكالمات")} ${calls.length}` },
            ]}
            active={tab}
            onChange={(key) => setTab(key as Tab)}
          />
        </div>

        {loading && !data ? (
          <div className="flex flex-col gap-space-3 px-space-8 pb-space-8">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-widget-row w-full rounded-widget" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="px-space-8 pb-space-8">
            {tab === "forms" ? (
              <EmptyState
                icon="clipboard-list"
                title={t("No forms sent yet.", "لم يُرسَل أي نموذج بعد.")}
                description={t("Send a discovery form and its answers appear here.", "أرسل نموذج استكشاف وستظهر إجاباته هنا.")}
                action={
                  <Button variant="outline" href={`/w/${brandSlug}/forms/new`}>
                    {t("New form", "نموذج جديد")}
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon="phone"
                title={t("No call notes yet.", "لا توجد ملاحظات مكالمات بعد.")}
                description={t("Paste notes or a transcript from a call to keep it with the answers.", "الصق ملاحظات أو نصًا مفرّغًا من مكالمة ليبقى مع الإجابات.")}
                action={addButton || undefined}
              />
            )}
          </div>
        ) : (
          <ul className="flex flex-col">
            {shown.map((item) =>
              item.type === "call" ? (
                <CallRow key={`c-${item.id}`} call={item} slug={brandSlug} canEdit={canEdit} isAr={isAr} onChanged={reload} />
              ) : (
                <FormRow key={`f-${item.id}`} form={item} slug={brandSlug} isAr={isAr} />
              )
            )}
          </ul>
        )}
      </section>

      <section className="mk-surface flex flex-wrap items-center justify-between gap-space-5 rounded-card bg-surface-1 p-space-8">
        <div className="flex items-start gap-space-4">
          <IconBadge icon="chart-line" tone="accent" />
          <div className="flex flex-col gap-space-1">
            <h2 className="text-h5 font-medium">{t("Brief analysis", "تحليل الموجز")}</h2>
            <p className="text-caption text-text-muted">
              {t(
                "A strategist's read of everything above: tensions, gaps and routes, every claim cited.",
                "قراءة استراتيجية لكل ما سبق: التناقضات والفجوات والمسارات، مع مصدر لكل فكرة."
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" href={`/w/${brandSlug}/analysis`} icon={<Icon name="chart-line" size={18} />}>
          {t("Open analysis", "فتح التحليل")}
        </Button>
      </section>
    </div>
  );
}

const rowClass = "flex min-h-widget-row items-center gap-space-5 px-space-8 py-space-4 shadow-rule-t first:shadow-none";

function FormRow({ form, slug, isAr }: { form: FeedForm; slug: string; isAr: boolean }) {
  const lang = isAr ? "ar" : "en";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const router = useRouter();
  const status = STATUS_META[form.status];
  return (
    <li className={rowClass}>
      <IconBadge icon="clipboard-list" tone="info" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-space-1">
        <Link href={formHref(slug, form)} className="bidi-plain max-w-full truncate text-body font-medium text-text hover:text-accent-text">
          {form.title}
        </Link>
        <span className="flex flex-wrap items-center gap-space-3 text-caption text-text-muted">
          <span>{form.date ? formatDay(callDay(form.date), isAr) : "—"}</span>
          {form.recipientName && <span className="bidi-plain">· {form.recipientName}</span>}
          <span className="tabular-nums">
            · {form.answered}/{form.total} {isAr ? "إجابة" : "answered"}
          </span>
        </span>
      </div>
      <Badge tone={status.tone} dot>
        {status[lang]}
      </Badge>
      <ActionsDropdown
        label={t("Actions", "إجراءات")}
        items={[
          { label: t("Open answers", "فتح الإجابات"), icon: "eye", onSelect: () => router.push(formHref(slug, form)) },
          { label: t("Theme and link", "التصميم والرابط"), icon: "link", tone: "info", onSelect: () => router.push(`/w/${slug}/forms/${form.id}/send`) },
        ]}
      />
    </li>
  );
}

type CallRowProps = { call: FeedCall; slug: string; canEdit: boolean; isAr: boolean; onChanged: () => void };

function CallRow({ call, slug, canEdit, isAr, onChanged }: CallRowProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();
  const href = callHref(slug, call.id);

  const run = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      showToast(done, "success");
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That didn't work.", "لم ينجح ذلك."), "danger");
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: t("Delete these call notes?", "حذف ملاحظات المكالمة؟"),
      body: t("They move to the trash and drop out of future analyses.", "تنتقل إلى المهملات وتخرج من التحليلات القادمة."),
      confirmLabel: t("Delete", "حذف"),
      tone: "danger",
      isAr,
    });
    if (ok) void run(() => deleteNote(call.id), t("Moved to the trash", "نُقلت إلى المهملات"));
  };

  return (
    <li className={rowClass}>
      <IconBadge icon="phone" tone="accent" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-space-1">
        <Link href={href} className="bidi-plain max-w-full truncate text-body font-medium text-text hover:text-accent-text">
          {call.title}
        </Link>
        <span className="flex flex-wrap items-center gap-space-3 text-caption text-text-muted">
          <span>{formatDay(callDay(call.callDate), isAr)}</span>
          {call.participants.length > 0 && (
            <span className="flex items-center gap-space-1" aria-label={call.participants.map((p) => p.name).join(", ")}>
              {call.participants.slice(0, 3).map((p, i) => (
                <Avatar key={i} initials={initials(p.name)} size={22} tone={p.role === "client" ? "accent" : "muted"} />
              ))}
            </span>
          )}
          <Badge>{KIND_META[call.kind][lang]}</Badge>
          <span>{LANGUAGE_META[call.language][lang]}</span>
          <span className="tabular-nums">
            · {call.wordCount.toLocaleString("en")} {t("words", "كلمة")}
          </span>
        </span>
      </div>
      <Badge tone={call.includeInAnalysis ? "success" : "neutral"} dot>
        {call.includeInAnalysis ? t("In analysis", "في التحليل") : t("Left out", "مستبعدة")}
      </Badge>
      {canEdit ? (
        <ActionsDropdown
          label={t("Actions", "إجراءات")}
          items={[
            { label: t("Open", "فتح"), icon: "eye", onSelect: () => router.push(href) },
            { label: t("Edit", "تعديل"), icon: "pen", onSelect: () => router.push(`${href}/edit`) },
            call.includeInAnalysis
              ? {
                  label: t("Leave out of analysis", "استبعاد من التحليل"),
                  icon: "eye-slash",
                  onSelect: () => void run(() => setIncluded(call.id, false), t("Left out of the analysis", "استُبعدت من التحليل")),
                }
              : {
                  label: t("Include in analysis", "تضمين في التحليل"),
                  icon: "check",
                  tone: "success" as const,
                  onSelect: () => void run(() => setIncluded(call.id, true), t("Included in the analysis", "ضُمّنت في التحليل")),
                },
            { label: t("Delete", "حذف"), icon: "trash", tone: "danger" as const, onSelect: () => void remove() },
          ]}
        />
      ) : (
        <Button variant="outline" size="sm" href={href}>
          {t("Open", "فتح")}
        </Button>
      )}
    </li>
  );
}

