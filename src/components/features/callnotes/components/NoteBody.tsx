"use client";

import { Fragment, type ReactNode } from "react";
import { ROLE_META } from "../constants";
import type { Participant, Turn } from "../types";
import { participantFor } from "../utils/format";
import { blocksOf } from "../utils/blocks";

/** `text` with every match of `query` marked; case-insensitive. */
function marked(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: ReactNode[] = [];
  let from = 0;
  let at = lower.indexOf(needle);
  while (at !== -1) {
    parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="rounded-xs bg-accent-soft text-text">
        {text.slice(at, at + q.length)}
      </mark>
    );
    from = at + q.length;
    at = lower.indexOf(needle, from);
  }
  parts.push(text.slice(from));
  return parts;
}

/** Each line in its own direction: a mixed note never forces one on the rest. */
const Lines = ({ text, query, isAr }: { text: string; query: string; isAr: boolean }) => (
  <>
    {text.split("\n").map((line, i) => (
      <p key={i} dir="auto" className={`min-h-[1em] ${/[؀-ۿ]/.test(line) || isAr ? "leading-[1.7]" : ""}`}>
        {marked(line, query)}
      </p>
    ))}
  </>
);

type TurnsProps = { turns: Turn[]; participants: Participant[]; query: string; isAr: boolean };

/** A transcript, turn by turn: who, which side (a dot only), when, what. */
export function TurnList({ turns, participants, query, isAr }: TurnsProps) {
  const lang = isAr ? "ar" : "en";
  return (
    <ol className="flex flex-col">
      {turns.map((turn, i) => {
        const who = participantFor(participants, turn.speaker);
        const role = who ? ROLE_META[who.role] : null;
        return (
          <li
            key={i}
            id={`turn-${i}`}
            data-cite-target
            className="flex scroll-mt-space-10 flex-col gap-space-2 rounded-lg px-space-5 py-space-5 transition-colors duration-base ease-standard motion-reduce:transition-none"
          >
            <div className="flex flex-wrap items-center gap-space-3 text-caption text-text-muted">
              {role && <span aria-hidden className={`size-2 rounded-full ${role.dot}`} />}
              <span className="bidi-plain font-medium text-text-secondary">
                {who?.name ?? turn.speaker ?? (isAr ? "بلا اسم" : "Unlabelled")}
              </span>
              {role && <span className="sr-only">({role[lang]})</span>}
              {turn.timestamp && <span className="tabular-nums">{turn.timestamp}</span>}
            </div>
            <div className="text-body text-text">
              <Lines text={turn.text} query={query} isAr={isAr} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Notes, block by block; a citation can point at one block. */
export function NoteParagraphs({ body, query, isAr }: { body: string; query: string; isAr: boolean }) {
  return (
    <div className="flex flex-col">
      {blocksOf(body).map((block, i) => (
        <Fragment key={i}>
          {block.gapBefore && <span aria-hidden className="h-space-5" />}
          <p
            id={`para-${i}`}
            data-cite-target
            dir="auto"
            className={`scroll-mt-space-10 rounded-lg px-space-5 py-space-1 text-body text-text transition-colors duration-base ease-standard motion-reduce:transition-none ${/[؀-ۿ]/.test(block.text) || isAr ? "leading-[1.7]" : ""}`}
          >
            {marked(block.text, query)}
          </p>
        </Fragment>
      ))}
    </div>
  );
}

/** The text exactly as it was pasted or extracted. */
export function OriginalText({ body, query, isAr }: { body: string; query: string; isAr: boolean }) {
  return (
    <div className="rounded-lg bg-surface-sunken p-space-6 text-body text-text-secondary shadow-edge-soft">
      <Lines text={body} query={query} isAr={isAr} />
    </div>
  );
}
