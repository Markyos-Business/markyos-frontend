"use client";

import { useEffect, useRef, useState } from "react";
import { AlertBanner, AppDate, Button, CheckboxField, EmptyState, Icon, SearchField, Skeleton, TextareaField } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { marketingHref } from "@/lib/marketing";
import { sanitizeRichHtml } from "@/lib/safeHtml";
import { getAppHelpArticle, getHelpFront, logAppHelpClick, searchAppHelp, sendAppHelpFeedback } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpCardItem, HelpFeedbackReason } from "../../types";

const REASONS: HelpFeedbackReason[] = ["outdated", "unclear", "missing_steps", "not_solved"];
const DEBOUNCE_MS = 250;
const SETTLE_MS = 1200;

/**
 * What the Help panel shows: an article, or the front (search, Getting
 * started, Popular). Opening a result stays in the panel; "Open the Help
 * Center" goes to the website in a new tab.
 */
export function HelpPanel({ initialSlug }: { initialSlug?: string }) {
  const [slug, setSlug] = useState<string | undefined>(initialSlug);
  return slug ? <ArticleView slug={slug} onBack={() => setSlug(undefined)} onOpen={setSlug} /> : <Front onOpen={setSlug} />;
}

function Front({ onOpen }: { onOpen: (slug: string) => void }) {
  const { h, lang } = useHelpCopy();
  const p = h.panel;
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ total: number; results: HelpCardItem[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const queryId = useRef<number | undefined>(undefined);
  const front = useRequest(() => getHelpFront(lang), `help-front:${lang}`);
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) return;
    let live = true;
    const fetchTimer = window.setTimeout(() => {
      searchAppHelp(term, lang)
        .then((r) => live && (setResults(r), setFailed(false)))
        .catch(() => live && setFailed(true));
    }, DEBOUNCE_MS);
    const logTimer = window.setTimeout(() => {
      searchAppHelp(term, lang, true)
        .then((r) => (queryId.current = r.queryId))
        .catch(() => undefined);
    }, SETTLE_MS);
    return () => {
      live = false;
      window.clearTimeout(fetchTimer);
      window.clearTimeout(logTimer);
    };
  }, [term, lang]);

  const open = (card: HelpCardItem) => {
    if (queryId.current) void logAppHelpClick(queryId.current, card.id).catch(() => undefined);
    onOpen(card.slug);
  };
  const searching = term.length >= 2;

  return (
    <div className="flex flex-col gap-space-8">
      <SearchField fullWidth label={p.search} placeholder={p.placeholder} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {searching ? (
        <section aria-live="polite" className="flex flex-col gap-space-4">
          {failed ? (
            <p className="text-body text-text-muted">{p.error}</p>
          ) : results ? (
            <>
              <p className="text-caption text-text-muted">{results.total ? p.results(results.total) : p.noResults(term)}</p>
              <CardList cards={results.results} onOpen={open} />
            </>
          ) : (
            <Skeleton className="h-24 rounded-card" />
          )}
        </section>
      ) : (
        <>
          {front.loading && !front.data && <Skeleton className="h-40 rounded-card" />}
          {front.data && front.data.gettingStarted.length > 0 && (
            <section className="flex flex-col gap-space-4">
              <h3 className="text-h5 font-medium">{p.gettingStarted}</h3>
              <CardList cards={front.data.gettingStarted} onOpen={open} />
            </section>
          )}
          {front.data && front.data.popular.length > 0 && (
            <section className="flex flex-col gap-space-4">
              <h3 className="text-h5 font-medium">{p.popular}</h3>
              <CardList cards={front.data.popular} onOpen={open} />
            </section>
          )}
        </>
      )}
      <a href={marketingHref("/help", lang)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-space-3 text-body font-medium text-accent">
        {p.helpCenter}
        <Icon name="external-link-alt" size={16} />
      </a>
    </div>
  );
}

function CardList({ cards, onOpen }: { cards: HelpCardItem[]; onOpen: (card: HelpCardItem) => void }) {
  return (
    <ul className="flex flex-col gap-space-3">
      {cards.map((card) => (
        <li key={card.id}>
          <button type="button" onClick={() => onOpen(card)} className="mk-btn flex w-full flex-col items-start gap-space-1 rounded-card bg-surface-2 p-space-6 text-start shadow-edge">
            <span dir="auto" className="text-body font-medium text-text">{card.title}</span>
            {card.categoryTitle && <span dir="auto" className="text-caption text-text-muted">{card.categoryTitle}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ArticleView({ slug, onBack, onOpen }: { slug: string; onBack: () => void; onOpen: (slug: string) => void }) {
  const { h, lang } = useHelpCopy();
  const p = h.panel;
  const article = useRequest(() => getAppHelpArticle(slug, lang), `help-panel:${slug}:${lang}`);
  const a = article.data;

  return (
    <div className="flex flex-col gap-space-6">
      <Button variant="ghost" size="sm" icon={<Icon name="arrow-left" size={16} />} onClick={onBack} className="self-start">
        {p.back}
      </Button>
      {article.loading && !a && <Skeleton className="h-64 rounded-card" />}
      {!article.loading && !a && <EmptyState icon="search" title={p.missing.title} description={p.missing.body} />}
      {a && (
        <article lang={a.locale} dir={a.locale === "ar" ? "rtl" : "ltr"} className="flex flex-col gap-space-5">
          {!a.inLocale && <AlertBanner tone="info" message={p.notInLocale} />}
          <header className="flex flex-col gap-space-3">
            <h3 className="text-h3 font-medium text-text">{a.title}</h3>
            {a.summary && <p className="text-body text-text-muted">{a.summary}</p>}
            {a.publishedAt && (
              <p className="text-caption text-text-muted">
                {p.updated} <AppDate value={a.publishedAt} locale={lang === "ar" ? "ar-u-nu-latn" : "en-GB"} />
              </p>
            )}
          </header>
          {/* Cleaned again here, with the allowlist the server applied on save. */}
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(a.bodyHtml, { help: true }) }} />
          <PanelFeedback articleId={a.id} locale={a.locale} />
          {a.related.length > 0 && (
            <section className="flex flex-col gap-space-4">
              <h4 className="text-h5 font-medium">{p.related}</h4>
              <CardList cards={a.related} onOpen={(card) => onOpen(card.slug)} />
            </section>
          )}
          {a.onWebsite && (
            <a
              href={marketingHref(`/help/${encodeURIComponent(a.categorySlug)}/${encodeURIComponent(a.slug)}`, a.locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-space-3 text-body font-medium text-accent"
            >
              {p.onWebsite}
              <Icon name="external-link-alt" size={16} />
            </a>
          )}
        </article>
      )}
    </div>
  );
}

function PanelFeedback({ articleId, locale }: { articleId: string; locale: "en" | "ar" }) {
  const { h } = useHelpCopy();
  const f = h.panel.feedback;
  const reasonWords = h.feedback.reasons;
  const [step, setStep] = useState<"ask" | "why" | "done">("ask");
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [reasons, setReasons] = useState<HelpFeedbackReason[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const send = async (helpful: boolean) => {
    setBusy(true);
    setError(false);
    try {
      await sendAppHelpFeedback(articleId, { locale, helpful, ...(helpful ? {} : { reasons, comment: comment.trim() }) });
      setAnswer(helpful);
      setStep("done");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mk-surface flex flex-col gap-space-5 rounded-card bg-surface-1 p-space-6">
      <h4 className="text-h5 font-medium" aria-live="polite">
        {step === "done" ? (answer ? f.thanksYes : f.thanksNo) : f.question}
      </h4>
      {step === "ask" && (
        <div className="flex gap-space-4">
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void send(true)}>{f.yes}</Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => setStep("why")}>{f.no}</Button>
        </div>
      )}
      {step === "why" && (
        <form
          className="flex flex-col gap-field-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void send(false);
          }}
        >
          <fieldset className="flex flex-col gap-space-3">
            <legend className="mb-space-3 text-body font-medium text-text">{f.reasons}</legend>
            {REASONS.map((r) => (
              <CheckboxField
                key={r}
                label={reasonWords[r]}
                checked={reasons.includes(r)}
                onChange={() => setReasons((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]))}
              />
            ))}
          </fieldset>
          <TextareaField label={f.comment} info={f.commentHint} value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} />
          <Button type="submit" variant="primary" size="sm" disabled={busy} className="self-start">{f.send}</Button>
        </form>
      )}
      {error && <p className="text-caption text-danger">{f.error}</p>}
    </section>
  );
}
