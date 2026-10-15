"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { useDialog } from "@/components/Dialog";
import { TopBar } from "@/components/workspace/TopBar";
import { Icon } from "@/components/Icon";
import { Badge, EmptyHint, Section } from "@/components/workspace/SectionUI";
import { PillButton } from "@/components/PillButton";
import { TextField } from "@/components/TextField";
import { BRIEF_QUESTIONS, BRIEF_TEMPLATES, QUESTION_BY_KEY } from "@/lib/briefQuestions";
import { Brief, BriefStatus, BriefTemplateKind, Lang } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

/**
 * Where a studio builds a discovery brief and reads what came back.
 *
 * Deliberately not a form builder. A studio picks a starting template, turns
 * questions off that don't apply, and sends a link — the wording of a good
 * brand question is the part Markyos supplies, and the part a studio would
 * otherwise spend an evening getting wrong.
 */

const STATUS_TONE: Record<BriefStatus, "accent" | "success" | "neutral" | "warning"> = {
  draft: "neutral",
  sent: "accent",
  in_progress: "warning",
  submitted: "success",
};

const STATUS_LABEL: Record<BriefStatus, string> = {
  draft: "Not sent",
  sent: "Sent, not opened",
  in_progress: "Being filled in",
  submitted: "Submitted",
};

export default function BriefPage() {
  const params = useParams<{ slug: string }>();
  const {
    getWorkspace,
    createBrief,
    setBriefQuestions,
    sendBrief,
    revokeBrief,
    deleteBrief,
    uiLang,
  } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const ws = getWorkspace(params.slug);

  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState<BriefTemplateKind>("new-brand");
  const [label, setLabel] = useState("");
  const [clientName, setClientName] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const out: { category: string; items: typeof BRIEF_QUESTIONS }[] = [];
    for (const q of BRIEF_QUESTIONS) {
      const last = out[out.length - 1];
      if (last && last.category === q.category) last.items.push(q);
      else out.push({ category: q.category, items: [q] });
    }
    return out;
  }, []);

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  const open = ws.briefs.find((b) => b.id === openId) ?? null;

  function handleCreate() {
    const id = createBrief(
      ws!.id,
      template,
      label.trim() || `${BRIEF_TEMPLATES[template].label} brief`,
      clientName.trim(),
      lang,
    );
    setCreating(false);
    setLabel("");
    setClientName("");
    setOpenId(id);
    showToast("Brief created — adjust the questions, then send it.", "success");
  }

  async function handleCopyLink(brief: Brief) {
    const url = `${window.location.origin}/b/${brief.token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied.", "success");
    } catch {
      // Clipboard blocked (insecure context, or permission denied). The link is
      // on screen and selectable, so this is a convenience that failed.
      showToast("The browser blocked copying — the link is on screen to select.", "danger");
    }
  }

  return (
    <>
      <TopBar workspace={ws} section="Discovery brief" arSection="موجز التعريف" />
      <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-6 overflow-auto max-w-[860px]">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? "موجز التعريف" : "Discovery brief"}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Send the client a bilingual questionnaire before the work starts. Answers arrive in
            Drafts as proposals against the strategy — never written straight into the brand.
          </p>
        </div>

        <Section
          title="Briefs"
          icon="clipboard-list"
          right={
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="mk-tap text-[12px] font-semibold cursor-pointer"
              style={{ color: "var(--accent-text)" }}
            >
              {creating ? "Cancel" : "+ New brief"}
            </button>
          }
        >
          {creating && (
            <div className="flex flex-col gap-4 pb-2">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
                  Starting point
                </span>
                <div className="flex flex-col gap-2">
                  {(Object.keys(BRIEF_TEMPLATES) as BriefTemplateKind[]).map((t) => {
                    const meta = BRIEF_TEMPLATES[t];
                    const active = template === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTemplate(t)}
                        aria-pressed={active}
                        className="text-start rounded-xl p-3.5 cursor-pointer"
                        style={{
                          background: active ? "var(--accent-soft)" : "var(--surface-2)",
                          boxShadow: active ? "inset 0 0 0 1px var(--accent-ring)" : "inset 0 0 0 1px var(--hairline-strong)",
                        }}
                      >
                        <div className="text-[13px] font-semibold" style={{ color: active ? "var(--accent-on-soft)" : "var(--text)" }}>
                          {isAr ? meta.arLabel : meta.label}
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {meta.description} · {meta.questions.length} questions
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <TextField
                label="Name this brief"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={`${BRIEF_TEMPLATES[template].label} brief`}
                hint="For your own reference — the client never sees it."
              />
              <TextField
                label="Who is filling it in"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Layla — Almarai Foods"
                hint="Recorded on every draft their answers produce, so you know whose words they are."
              />

              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: ".08em", color: "var(--text-faint)" }}>
                  Language it opens in
                </span>
                <div className="flex gap-2">
                  {(["en", "ar"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      aria-pressed={lang === l}
                      className="h-9 px-4 rounded-full text-[12.5px] font-semibold cursor-pointer"
                      style={{
                        background: lang === l ? "var(--accent-soft)" : "var(--surface-2)",
                        color: lang === l ? "var(--accent-on-soft)" : "var(--text-muted)",
                      }}
                    >
                      {l === "en" ? "English" : "العربية"}
                    </button>
                  ))}
                </div>
                <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
                  They can switch either way — this is only which one loads first.
                </span>
              </div>

              <div>
                <PillButton onClick={handleCreate}>Create brief</PillButton>
              </div>
            </div>
          )}

          {ws.briefs.length === 0 && !creating ? (
            <EmptyHint>
              No briefs yet. Send one before the first design decision, not after — it is the
              cheapest way to avoid three rounds of revisions.
            </EmptyHint>
          ) : (
            <div className="flex flex-col gap-2.5">
              {ws.briefs.map((b) => {
                const answered = b.answers.filter((a) => a.value.trim()).length;
                const isOpen = openId === b.id;
                return (
                  <div
                    key={b.id}
                    className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span dir="auto" className="bidi-auto text-[13.5px] font-semibold">{b.label}</span>
                          <Badge tone={b.revokedAt ? "neutral" : STATUS_TONE[b.status]}>
                            {b.revokedAt ? "Closed" : STATUS_LABEL[b.status]}
                          </Badge>
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                          {b.clientName && <span dir="auto" className="bidi-auto">{b.clientName} · </span>}
                          {answered}/{b.questions.length} answered · created {formatRelative(b.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : b.id)}
                          className="mk-tap text-[12px] font-semibold cursor-pointer px-1"
                          style={{ color: "var(--accent-text)" }}
                          aria-expanded={isOpen}
                        >
                          {isOpen ? "Close" : b.status === "submitted" ? "Read answers" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {/* The link is shown, not just copyable: a studio pasting it
                        into their own email client needs to see what they are
                        sending, and clipboard access is not guaranteed. */}
                    {b.status !== "draft" && !b.revokedAt && (
                      <div
                        className="rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap"
                        style={{ background: "var(--surface-1)" }}
                      >
                        <span
                          dir="ltr"
                          className="text-[11.5px] truncate"
                          style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-secondary)" }}
                        >
                          /b/{b.token}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopyLink(b)}
                          className="mk-tap ms-auto text-[11.5px] font-semibold cursor-pointer"
                          style={{ color: "var(--accent-text)" }}
                        >
                          Copy link
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {b.status === "draft" && (
                        <PillButton
                          size="sm"
                          onClick={() => {
                            sendBrief(ws.id, b.id);
                            showToast("Brief is live — copy the link and send it.", "success");
                          }}
                        >
                          Send it
                        </PillButton>
                      )}
                      {b.status !== "draft" && !b.revokedAt && (
                        <PillButton
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Close this brief?",
                              body: "The link stops working. Anything already answered is kept, and you can send a new brief instead.",
                              confirmLabel: "Close it",
                              tone: "danger",
                            });
                            if (ok) {
                              revokeBrief(ws.id, b.id);
                              showToast("Link closed.");
                            }
                          }}
                        >
                          Close link
                        </PillButton>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Delete “${b.label}”?`,
                            body: "Drafts this brief already produced are kept — they live in the queue now, not here.",
                            consequences: answered
                              ? [`${answered} answer${answered === 1 ? "" : "s"} the client wrote`, "The link, permanently"]
                              : ["The link, permanently"],
                            confirmLabel: "Delete",
                            tone: "danger",
                            // Type-to-confirm only when there is something to
                            // lose. An unanswered brief takes ten seconds to
                            // recreate, and ceremony over nothing teaches people
                            // to click through the dialog that does matter.
                            confirmPhrase: answered ? b.label : undefined,
                            confirmPhraseLabel: answered ? `Type “${b.label}” to confirm` : undefined,
                          });
                          if (ok) {
                            if (openId === b.id) setOpenId(null);
                            deleteBrief(ws.id, b.id);
                            showToast("Brief deleted.");
                          }
                        }}
                        className="mk-tap text-[12px] cursor-pointer"
                        style={{ color: "var(--text-faint)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {open && open.status === "submitted" && <Answers brief={open} />}

        {open && open.status !== "submitted" && (
          <Section title={`Questions — ${open.label}`} icon="list-ul">
            <p className="text-[12.5px] -mt-1 mb-2" style={{ color: "var(--text-muted)" }}>
              {open.questions.length} of {BRIEF_QUESTIONS.length} included. A question mapped to a
              strategy field is marked — those are the answers that become drafts.
            </p>
            <div className="flex flex-col gap-4">
              {categories.map((group) => (
                <div key={group.category} className="flex flex-col gap-1.5">
                  <span
                    className="text-[10.5px] font-semibold uppercase"
                    style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}
                  >
                    {group.category}
                  </span>
                  {group.items.map((q) => {
                    const included = open.questions.includes(q.key);
                    return (
                      <button
                        key={q.key}
                        type="button"
                        role="switch"
                        aria-checked={included}
                        onClick={() => {
                          const next = included
                            ? open.questions.filter((k) => k !== q.key)
                            : // Re-inserted in library order rather than appended, so
                              // toggling a question off and on again does not move it to
                              // the end of the brief.
                              BRIEF_QUESTIONS.filter(
                                (lib) => lib.key === q.key || open.questions.includes(lib.key),
                              ).map((lib) => lib.key);
                          setBriefQuestions(ws.id, open.id, next);
                        }}
                        className="text-start rounded-lg px-3 py-2.5 flex items-start gap-2.5 cursor-pointer"
                        style={{ background: included ? "var(--surface-2)" : "transparent" }}
                      >
                        <span
                          className="w-[16px] h-[16px] rounded-[4px] grid place-items-center shrink-0 mt-[2px]"
                          style={{
                            background: included ? "var(--accent)" : "transparent",
                            boxShadow: included ? "none" : "inset 0 0 0 1px var(--hairline-strong)",
                          }}
                        >
                          {included && <Icon name="check" size={10} style={{ color: "var(--accent-ink)" }} />}
                        </span>
                        <span className="min-w-0">
                          <span
                            className="text-[12.5px] block"
                            style={{ color: included ? "var(--text)" : "var(--text-muted)" }}
                          >
                            {isAr ? q.promptAr : q.promptEn}
                          </span>
                          {q.strategyField && (
                            <span className="text-[11px]" style={{ color: "var(--accent-text)" }}>
                              → {q.strategyField}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </>
  );
}

function Answers({ brief }: { brief: Brief }) {
  return (
    <Section title={`Answers — ${brief.label}`} icon="clipboard-list">
      <p className="text-[12.5px] -mt-1 mb-1" style={{ color: "var(--text-muted)" }}>
        Submitted {formatRelative(brief.submittedAt ?? brief.createdAt)}. Answers mapped to a
        strategy field are already waiting in Drafts.
      </p>
      <div className="flex flex-col gap-4">
        {brief.questions.map((key) => {
          const q = QUESTION_BY_KEY.get(key);
          if (!q) return null;
          const answer = brief.answers.find((a) => a.questionKey === key)?.value ?? "";
          const choice = q.choices?.find((c) => c.value === answer);
          return (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium" style={{ color: "var(--text-muted)" }}>
                {brief.lang === "ar" ? q.promptAr : q.promptEn}
              </span>
              {answer.trim() ? (
                <p dir="auto" className="bidi-auto text-[14px] leading-[1.6] whitespace-pre-wrap">
                  {choice ? (brief.lang === "ar" ? choice.labelAr : choice.labelEn) : answer}
                </p>
              ) : (
                <span className="text-[13px] italic" style={{ color: "var(--text-faint)" }}>
                  Left blank
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
