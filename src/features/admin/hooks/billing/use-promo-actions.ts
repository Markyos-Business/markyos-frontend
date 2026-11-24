"use client";

import { useState } from "react";
import { useDialog, useToast } from "@/components/ui";
import type { PromoGenerateAnswer } from "@/features/billing";
import { errorText } from "@/lib/api/errorText";
import { saveBlob } from "@/lib/download";
import { codesCsv, disableBatch, disableCode, generateCodes } from "../../api/admin-promo.api";
import { toGenerateRequest, type GenerateForm } from "../../utils/promo";
import { useAdminPromoLang } from "../shared/use-admin-lang";

/**
 * What an admin does with promo codes: generate a batch, copy, download its
 * CSV, disable a code or a whole batch. Disabling asks first, with a reason
 * the server logs; each outcome is a toast. The server decides everything.
 */
export function usePromoActions(onChanged: () => void) {
  const { p, isAr, lang } = useAdminPromoLang();
  const { showToast } = useToast();
  const { prompt } = useDialog();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PromoGenerateAnswer | null>(null);
  // The code or batch being disabled, and the batch whose CSV is on its way.
  const [disabling, setDisabling] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const fail = (err: unknown, en: string, ar: string) => errorText(err, lang, { en, ar });

  async function copy(text: string, many = false) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(many ? p.copiedAll : p.copied, "success");
    } catch {
      showToast(p.copyFailed, "danger");
    }
  }

  /** From the Generate dialog: an error to show in it, or nothing once the codes are made. */
  async function generate(form: GenerateForm): Promise<string | void> {
    try {
      const answer = await generateCodes(toGenerateRequest(form));
      setResult(answer);
      onChanged();
    } catch (err) {
      return fail(err, "Couldn't generate the codes. Try again.", "تعذّر إنشاء الرموز. حاول مرة أخرى.");
    }
  }

  async function csv(batchId: string) {
    if (downloading) return;
    setDownloading(batchId);
    try {
      saveBlob(await codesCsv(batchId), `promo-codes-${batchId}.csv`);
    } catch (err) {
      showToast(fail(err, "Couldn't download the CSV. Try again.", "تعذّر تنزيل ملف CSV. حاول مرة أخرى."), "danger");
    } finally {
      setDownloading(null);
    }
  }

  /** Destructive: a red confirm that asks the reason. */
  async function disable(code: { id: string; code: string }) {
    if (disabling) return;
    const reason = await prompt({ title: p.disable.title(code.code), body: p.disable.body, label: p.disable.reason, confirmLabel: p.disable.confirm, tone: "danger", isAr });
    if (!reason) return;
    setDisabling(code.id);
    try {
      await disableCode(code.id, reason);
      showToast(p.disable.done(code.code), "success");
      onChanged();
    } catch (err) {
      showToast(fail(err, "Couldn't disable the code. Try again.", "تعذّر إيقاف الرمز. حاول مرة أخرى."), "danger");
    } finally {
      setDisabling(null);
    }
  }

  async function disableAll(batchId: string) {
    if (disabling) return;
    const reason = await prompt({ title: p.disableBatch.title, body: p.disableBatch.body, label: p.disableBatch.reason, confirmLabel: p.disableBatch.confirm, tone: "danger", isAr });
    if (!reason) return;
    setDisabling(batchId);
    try {
      await disableBatch(batchId, reason);
      showToast(p.disableBatch.done, "success");
      onChanged();
    } catch (err) {
      showToast(fail(err, "Couldn't disable the batch. Try again.", "تعذّر إيقاف الدفعة. حاول مرة أخرى."), "danger");
    } finally {
      setDisabling(null);
    }
  }

  return { generating, setGenerating, result, setResult, disabling, downloading, copy, generate, csv, disable, disableAll };
}

export type PromoActions = ReturnType<typeof usePromoActions>;
