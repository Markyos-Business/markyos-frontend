"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, EmptyState, ErrorState, Icon, KeyValueList, PageHeader, Skeleton, formatDayMonth, useDialog, useToast } from "@/components/ui";
import type { KeyValueItem } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/errorText";
import { deleteMessage, getMessage } from "../../api/content.api";
import { useContentLang } from "../../hooks/use-content-lang";
import { DeliveryTag } from "./delivery-tag";
import { replyHref } from "./message-mail";
import { MESSAGES_HOME } from "./messages-view";

/** One contact message in full: every field the form sent, the text as written, and a reply link. */
export function MessageDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { c, lang } = useContentLang();
  const t = c.messages;
  const f = t.fields;
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const request = useRequest(() => getMessage(id), `content-message:${id}`);
  const m = request.data;
  const back = <Link href={MESSAGES_HOME}>{t.back}</Link>;

  if (!m) {
    if (request.failure instanceof ApiError && request.failure.status === 404) {
      return (
        <div className="flex flex-col gap-space-8">
          <PageHeader title={t.title} breadcrumb={back} />
          <EmptyState icon="inbox" title={t.notFound} description={t.emptyBody} />
        </div>
      );
    }
    if (request.failure) {
      return (
        <div className="flex flex-col gap-space-8">
          <PageHeader title={t.title} breadcrumb={back} />
          <ErrorState message={errorText(request.failure, lang)} onRetry={request.reload} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-space-8" aria-busy="true">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  const remove = async () => {
    const ok = await confirm({ title: t.removeConfirm, body: t.removeBody, confirmLabel: t.delete, tone: "danger" });
    if (!ok) return;
    try {
      await deleteMessage(m.id);
      showToast(t.deleted, "success");
      router.replace(MESSAGES_HOME);
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    }
  };

  const sent = new Date(m.createdAt);
  const dash = (v: string) => (v ? v : "—");
  const replyIn = m.replyLanguage === "ar" || m.replyLanguage === "en" ? c.inbox.languages[m.replyLanguage] : dash(m.replyLanguage);
  const items: KeyValueItem[] = [
    { label: f.name, value: dash(m.name) },
    { label: f.email, value: <bdi dir="ltr">{m.email}</bdi> },
    { label: f.topic, value: t.topics[m.topic] ?? m.topic },
    { label: f.who, value: m.who ? t.who[m.who] ?? m.who : "—" },
    { label: f.company, value: dash(m.company) },
    { label: f.country, value: dash(m.country) },
    { label: f.phone, value: m.phone ? <bdi dir="ltr">{m.phone}</bdi> : "—" },
    { label: f.replyLanguage, value: replyIn },
    { label: f.locale, value: c.inbox.languages[m.locale] ?? m.locale },
    {
      label: f.date,
      // "12 Sep 2026, 17:30": the app's day-first date, then the time.
      value: <time dateTime={m.createdAt}>{formatDayMonth(sent, lang, true)}{lang === "ar" ? "، " : ", "}{sent.toLocaleTimeString(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</time>,
    },
    { label: f.delivery, value: <DeliveryTag message={m} /> },
    ...(!m.emailed && m.emailError ? [{ label: f.error, value: <bdi>{m.emailError}</bdi> }] : []),
  ];

  return (
    <div className="flex flex-col gap-space-8">
      <PageHeader
        title={m.name || m.email}
        breadcrumb={back}
        description={t.topics[m.topic] ?? m.topic}
        actions={
          <Button variant="primary" href={replyHref(m)} icon={<Icon name="envelope" size={18} />}>
            {t.reply}
          </Button>
        }
        secondaryActions={
          <Button variant="danger" icon={<Icon name="trash" size={18} />} onClick={() => void remove()}>
            {t.delete}
          </Button>
        }
      />
      <div className="grid gap-space-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="mk-surface flex flex-col gap-space-5 rounded-card bg-surface-1 p-space-8" aria-labelledby="message-body">
          <h2 id="message-body" className="text-h5 font-medium">{f.message}</h2>
          <p dir="auto" className="whitespace-pre-wrap break-words text-body text-text">{m.message}</p>
        </section>
        <aside className="mk-surface self-start rounded-card bg-surface-1 p-space-8">
          <KeyValueList items={items} />
        </aside>
      </div>
    </div>
  );
}
