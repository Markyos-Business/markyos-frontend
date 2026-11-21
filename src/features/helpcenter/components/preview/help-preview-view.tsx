"use client";

import { AlertBanner, EmptyState, Skeleton } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { sanitizeRichHtml } from "@/lib/safeHtml";
import { getHelpPreview } from "../../api/help.api";
import { HELP_COPY } from "../../copy";
import { useHelpCopy } from "../../hooks/use-help-copy";

/**
 * A draft behind a signed preview link: no account needed, the link is the
 * key and it stops working after 7 days. Shown plainly; the website's own
 * article page (C4) is where a published article lives.
 */
export function HelpPreviewView({ token }: { token: string }) {
  const { h } = useHelpCopy();
  const p = h.preview;
  const preview = useRequest(() => getHelpPreview(token), `help-preview:${token}`);

  if (preview.loading && !preview.data) return <Skeleton className="mx-auto h-96 w-full max-w-3xl rounded-card" />;
  if (!preview.data) return <EmptyState icon="link" title={p.expired.title} description={p.expired.body} />;

  const a = preview.data;
  const dir = a.locale === "ar" ? "rtl" : "ltr";
  // The page speaks the article's language, banner included.
  const words = HELP_COPY[a.locale];
  return (
    <article lang={a.locale} dir={dir} className="mx-auto flex w-full max-w-3xl flex-col gap-space-6 px-space-6 py-space-10">
      <AlertBanner tone="info" message={`${words.preview.banner} ${words.preview.status(words.articles.status[a.status])}`} />
      <header className="flex flex-col gap-space-3">
        <h1 className="text-h2 font-medium text-text">{a.title}</h1>
        {a.summary && <p className="text-body text-text-muted">{a.summary}</p>}
      </header>
      {/* Sanitised again here, with the same allowlist the server applied on save. */}
      <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(a.bodyHtml, { help: true }) }} />
    </article>
  );
}
