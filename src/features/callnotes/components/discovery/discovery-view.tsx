"use client";

import { useAccountCopy } from "@/contexts/useAccountCopy";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionsDropdown, AlertBanner, Avatar, Badge, Button, EmptyState, Icon, IconBadge, PageHeader, Skeleton, Stagger, useDialog, useToast } from "@/components/ui";
import { STATUS_META, formatDay, publicUrl, sendForm } from "@/features/discovery";
import { KIND_META, LANGUAGE_META } from "../../constants";
import { useDiscoveryFeed } from "../../hooks/discovery/use-discovery-feed";
import { deleteNote, setIncluded } from "../../api/call-notes.api";
import type { FeedCall, FeedForm } from "../../types";
import { callDay, initials } from "../../utils/format";
import { errorText } from "@/lib/api/errorText";

type Section = "questionnaires" | "calls";

type DiscoveryViewProps = {
  brandId: string;
  brandSlug: string;
  isAr: boolean;
  /** Which part is open; the top bar's tabs choose it (Analysis is the third tab, drawn by its own view). */
  section: Section;
};

const base = (slug: string) => `/w/${slug}/discovery`;
export const callHref = (slug: string, id: string) => `${base(slug)}/calls/${id}`;
/** The title link covers its row; the ⋯ menu sits above it so it stays its own target. */
const stretched = "after:absolute after:inset-0 after:content-['']";

const formHref = (slug: string, form: FeedForm) => `/w/${slug}/forms/${form.id}/${form.status === "draft" ? "edit" : "answers"}`;

/**
 * Everything the client has told the studio, in two clear parts: the
 * questionnaire they fill in (with its share link right there, since sending
 * it is the point) and the notes from calls. The analysis reads both.
 */
export function DiscoveryView({ brandId, brandSlug, isAr, section }: DiscoveryViewProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const copy = useAccountCopy(isAr);
  const { data, error, loading, reload } = useDiscoveryFeed(brandId);
  const items = data?.items ?? [];
  const forms = items.filter((i): i is FeedForm => i.type === "form");
  const calls = items.filter((i): i is FeedCall => i.type === "call");
  const canEdit = data?.canEdit ?? false;
  const newFormHref = `/w/${brandSlug}/forms/new`;

  const addCallButton = canEdit && (
    <Button variant="primary" href={`${base(brandSlug)}/calls/new`} icon={<Icon name="plus" size={18} />}>
      {t("Add call notes", "إضافة ملاحظات مكالمة")}
    </Button>
  );
  const newFormButton = canEdit && (
    <Button variant="primary" href={newFormHref} icon={<Icon name="plus" size={18} />}>
      {t("New questionnaire", "استبيان جديد")}
    </Button>
  );

  const loadingRows = (
    <div className="flex flex-col gap-space-3 px-space-8 pb-space-8">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-widget-row w-full rounded-widget" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("Discovery", "الاكتشاف")}
        description={copy.discoveryIntro}
      />

      <AlertBanner message={error} />

      <section className="mk-surface flex flex-col rounded-card bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-ctl-row px-space-8 pt-space-8 pb-space-5">
          <h2 className="flex items-center gap-space-3 text-h5 font-medium">
            {section === "questionnaires" ? t("Questionnaire", "الاستبيان") : t("Call notes", "ملاحظات المكالمات")}
            {data && <Badge tone="neutral">{section === "questionnaires" ? forms.length : calls.length}</Badge>}
          </h2>
          <div className="flex flex-wrap items-center gap-ctl-row">
            {section === "questionnaires" ? (
              <>
                <Button variant="outline" href={`/w/${brandSlug}/forms`} icon={<Icon name="clipboard-list" size={18} />}>
                  {t("All questionnaires", "كل الاستبيانات")}
                </Button>
                {/* With none yet, the empty state below carries the one button. */}
                {forms.length > 0 && newFormButton}
              </>
            ) : (
              calls.length > 0 && addCallButton
            )}
          </div>
        </div>

        {loading && !data ? (
          loadingRows
        ) : section === "questionnaires" ? (
          forms.length === 0 ? (
            <div className="px-space-8 pb-space-8">
              <EmptyState
                icon="clipboard-list"
                title={t("No questionnaire yet.", "لا يوجد استبيان بعد.")}
                description={copy.questionnaireEmpty}
                action={newFormButton || undefined}
              />
            </div>
          ) : (
            <Stagger as="ul" className="flex flex-col">
              {forms.map((form) => (
                <FormRow key={form.id} form={form} slug={brandSlug} isAr={isAr} canEdit={canEdit} onChanged={reload} />
              ))}
            </Stagger>
          )
        ) : calls.length === 0 ? (
          <div className="px-space-8 pb-space-8">
            <EmptyState
              icon="phone"
              title={t("No call notes yet.", "لا توجد ملاحظات مكالمات بعد.")}
              description={t("Paste notes or a transcript from a call to keep it with the answers.", "الصق ملاحظات أو نصًا مفرّغًا من مكالمة ليبقى مع الإجابات.")}
              action={addCallButton || undefined}
            />
          </div>
        ) : (
          <Stagger as="ul" className="flex flex-col">
            {calls.map((call) => (
              <CallRow key={call.id} call={call} slug={brandSlug} canEdit={canEdit} isAr={isAr} onChanged={reload} />
            ))}
          </Stagger>
        )}
      </section>

    </div>
  );
}

// `relative` so each row's title link can stretch over the row: a click anywhere opens it.
const rowClass = "relative flex min-h-widget-row flex-wrap items-center gap-x-space-5 gap-y-space-3 px-space-6 py-space-4 shadow-rule-t first:shadow-none sm:px-space-8";

type FormRowProps = { form: FeedForm; slug: string; isAr: boolean; canEdit: boolean; onChanged: () => void };

/** One questionnaire: where it stands, and its share link front and centre. */
function FormRow({ form, slug, isAr, canEdit, onChanged }: FormRowProps) {
  const lang = isAr ? "ar" : "en";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const copy = useAccountCopy(isAr);
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const status = STATUS_META[form.status];
  const link = form.publicToken ? publicUrl(form.publicToken) : null;
  const isDraft = form.status === "draft";

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(copy.linkCopied, "success");
    } catch {
      showToast(t("Couldn't copy. Open the questionnaire's link page to copy it.", "تعذّر النسخ. افتح صفحة رابط الاستبيان لنسخه."), "danger");
    }
  };

  // A draft has no link yet. Getting one publishes it without emailing anyone,
  // the same as "Mark as sent", and copies the link straight away.
  const getLink = async () => {
    setBusy(true);
    try {
      const sent = await sendForm(form.id, {});
      if (sent.publicToken) {
        try {
          await navigator.clipboard.writeText(publicUrl(sent.publicToken));
          showToast(copy.linkReady, "success");
        } catch {
          showToast(t("Link ready. Copy it from the row's menu.", "الرابط جاهز. انسخه من قائمة السطر."), "success");
        }
      }
      onChanged();
    } catch (err) {
      showToast(errorText(err, isAr ? "ar" : "en", { en: "That didn't work.", ar: "لم ينجح ذلك." }), "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={rowClass}>
      {/* On a phone the title and its details take the first line and the
          status and actions the second, so nothing is squeezed or clipped. */}
      <div className="flex min-w-0 flex-1 basis-full items-center gap-space-5 sm:basis-0">
        <IconBadge icon="clipboard-list" tone="info" />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-space-1">
          <Link href={formHref(slug, form)} className={`bidi-plain max-w-full truncate text-body font-medium text-text hover:text-accent-text ${stretched}`}>
            {form.title}
          </Link>
          <span className="flex flex-wrap items-center gap-space-3 text-caption text-text-muted">
            <span>{form.date ? formatDay(callDay(form.date), isAr) : "—"}</span>
            {form.recipientName && <span className="bidi-plain">· {form.recipientName}</span>}
            <span className="tabular-nums">
              ·{" "}
              {isDraft
                ? t(`${form.questions} questions`, `${form.questions} سؤال`)
                : t(`${form.answered}/${form.total} answered`, `${form.answered}/${form.total} إجابة`)}
            </span>
          </span>
        </div>
      </div>
      <div className="flex w-full items-center gap-space-3 sm:w-auto">
        <Badge tone={status.tone} dot>
          {status[lang]}
        </Badge>
        {/* Copy link, Get share link and the rest live in the row's ⋯ menu: no buttons in a row. */}
        <div className="relative z-10 ms-auto">
          <ActionsDropdown
            iconOnly
            label={t(`${form.title} actions`, `إجراءات ${form.title}`)}
            items={[
              isDraft
                ? { label: t("Edit questions", "تعديل الأسئلة"), icon: "pen", onSelect: () => router.push(formHref(slug, form)) }
                : { label: t("Open answers", "فتح الإجابات"), icon: "eye", onSelect: () => router.push(formHref(slug, form)) },
              ...(link ? [{ label: t("Copy link", "نسخ الرابط"), icon: "copy", onSelect: () => void copyLink(link) }] : []),
              ...(!link && isDraft && canEdit
                ? [{
                    label: busy ? t("Getting link…", "جارٍ إنشاء الرابط…") : t("Get share link", "إنشاء رابط المشاركة"),
                    icon: "link",
                    disabled: busy || form.questions === 0,
                    reason: form.questions === 0 ? t("Add a question first.", "أضف سؤالًا أولًا.") : undefined,
                    onSelect: () => void getLink(),
                  }]
                : []),
              ...(link ? [{ label: copy.openAnswerPage, icon: "external-link-alt", onSelect: () => window.open(link, "_blank", "noopener") }] : []),
              { label: t("Theme, link and sending", "التصميم والرابط والإرسال"), icon: "share-alt", tone: "info" as const, onSelect: () => router.push(`/w/${slug}/forms/${form.id}/send`) },
            ]}
          />
        </div>
      </div>
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
      showToast(errorText(err, isAr ? "ar" : "en", { en: "That didn't work.", ar: "لم ينجح ذلك." }), "danger");
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
        <Link href={href} className={`bidi-plain max-w-full truncate text-body font-medium text-text hover:text-accent-text ${stretched}`}>
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
      {/* Someone who can't edit opens the notes from the row itself; there is nothing else to do. */}
      {canEdit && (
        <div className="relative z-10">
        <ActionsDropdown
          iconOnly
          label={t(`${call.title} actions`, `إجراءات ${call.title}`)}
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
        </div>
      )}
    </li>
  );
}

