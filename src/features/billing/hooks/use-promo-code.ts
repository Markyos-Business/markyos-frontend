"use client";

import { useCallback, useRef, useState } from "react";
import { errorText } from "@/lib/api/errorText";
import { checkCode } from "../api/billing.api";
import { billingCopy } from "../copy";
import type { PromoRefusal, PromoTerms } from "../types";
import { normaliseCode, readCheck } from "../utils/promo";

/** What went wrong with a code: a refusal (one sentence per reason) or any other failure, worded when shown. */
export type PromoProblem = { kind: "empty" } | { kind: "refused"; reason: PromoRefusal } | { kind: "failed"; error: unknown };

/** The problem in the reader's language. */
export function promoProblemText(problem: PromoProblem, isAr: boolean): string {
  const copy = billingCopy(isAr).promo;
  if (problem.kind === "empty") return copy.empty;
  if (problem.kind === "refused") return copy.reasons[problem.reason];
  return errorText(problem.error, isAr ? "ar" : "en", { en: billingCopy(false).promo.failed, ar: billingCopy(true).promo.failed });
}

/**
 * The upgrade modal's promo code (plan §3): the typed text, the server's
 * terms once it accepts it, or why it didn't. The browser keeps no price of
 * its own: the terms are the server's answer, and checkout sends the code
 * back for the server to check again.
 */
export function usePromoCode(brandId: string, initial?: string | null) {
  const seed = initial ? normaliseCode(initial) : "";
  const [open, setOpen] = useState(seed !== "");
  const [text, setText] = useState(seed);
  const [terms, setTerms] = useState<PromoTerms | null>(null);
  const [problem, setProblem] = useState<PromoProblem | null>(null);
  const [busy, setBusy] = useState(false);
  // The latest check wins: an older answer arriving late is dropped.
  const run = useRef(0);

  const type = useCallback((value: string) => {
    setText(value.toUpperCase());
    setProblem(null);
  }, []);

  const apply = useCallback(async () => {
    const code = normaliseCode(text);
    setText(code);
    if (!code) {
      setProblem({ kind: "empty" });
      return;
    }
    const mine = ++run.current;
    setBusy(true);
    setProblem(null);
    try {
      const answer = readCheck(await checkCode(brandId, code));
      if (mine !== run.current) return;
      if ("terms" in answer) setTerms(answer.terms);
      else setProblem({ kind: "refused", reason: answer.refused });
    } catch (error) {
      // Throttled, offline or a server fault: errorText words it.
      if (mine === run.current) setProblem({ kind: "failed", error });
    } finally {
      if (mine === run.current) setBusy(false);
    }
  }, [brandId, text]);

  /** Back to the full price, with the field open and empty. */
  const remove = useCallback(() => {
    run.current += 1;
    setTerms(null);
    setText("");
    setProblem(null);
    setBusy(false);
  }, []);

  /** The server refused the code at checkout (it ran out or expired since Apply): drop it and say why. */
  const refused = useCallback((reason: PromoRefusal) => {
    run.current += 1;
    setTerms(null);
    setOpen(true);
    setProblem({ kind: "refused", reason });
  }, []);

  return { open, setOpen, text, type, terms, problem, busy, apply, remove, refused };
}

export type PromoCodeState = ReturnType<typeof usePromoCode>;
