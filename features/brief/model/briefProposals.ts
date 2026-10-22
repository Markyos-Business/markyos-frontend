import type { Brief, Draft, Workspace } from "@/core/data/types";
import { uid } from "@/shared/lib/utils";
import { QUESTION_BY_KEY } from "./briefQuestions";

/**
 * A sent brief's answers as strategy proposals.
 *
 * Answers become proposals, not writes. This is the whole reason the brief
 * can be handed to someone outside the studio.
 */
export function briefProposals(brief: Brief, now: number): Draft[] {
  const requestedBy = brief.clientName || "the client";
  const drafts: Draft[] = [];
  for (const answer of brief.answers) {
    const question = QUESTION_BY_KEY.get(answer.questionKey);
    if (!question?.strategyField) continue;
    if (!answer.value.trim()) continue;
    drafts.push({
      id: uid(),
      targetType: "strategyField",
      targetRef: question.strategyField,
      content: answer.value.trim(),
      source: "brief",
      provenance: {
        summary: `Discovery brief — “${brief.lang === "ar" ? question.promptAr : question.promptEn}”`,
        inputs: [question.key],
        requestedBy,
      },
      status: "pending",
      createdAt: now,
      decidedAt: null,
      decidedBy: null,
    });
  }
  return drafts;
}

/**
 * `ws` with the proposals of every brief a client sent from their own device.
 *
 * The server only marks such a brief (`proposalsPending`); the mapping from
 * question to strategy field lives here, so it is applied when the studio's
 * app next sees the brand. Returns `ws` itself when there is nothing to do.
 */
export function withBriefProposals(ws: Workspace): Workspace {
  if (!ws.briefs.some((b) => b.proposalsPending)) return ws;
  const now = Date.now();
  const drafts = ws.briefs.filter((b) => b.proposalsPending).flatMap((b) => briefProposals(b, now));
  return {
    ...ws,
    briefs: ws.briefs.map((b) => (b.proposalsPending ? { ...b, proposalsPending: false } : b)),
    drafts: [...drafts, ...ws.drafts],
  };
}
