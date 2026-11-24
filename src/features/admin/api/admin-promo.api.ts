import { api, apiFile } from "@/lib/api/client";
import type { PromoCodeDetail, PromoCodePage, PromoCodeQuery, PromoGenerateAnswer, PromoGenerateRequest } from "@/features/billing";

/*
 * The admin promo code endpoints (promo-codes-plan §4). The server makes the
 * codes, checks every setting and logs each generate and disable with its
 * note; these only ask.
 */
const id = (value: string) => encodeURIComponent(value);

function query(q: PromoCodeQuery): string {
  const params = new URLSearchParams();
  if (q.batch) params.set("batch", q.batch);
  if (q.status) params.set("status", q.status);
  if (q.page && q.page > 1) params.set("page", String(q.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listCodes(q: PromoCodeQuery = {}): Promise<PromoCodePage> {
  return api<PromoCodePage>(`/admin/billing/codes/${query(q)}`);
}

export function getCode(codeId: string): Promise<PromoCodeDetail> {
  return api<PromoCodeDetail>(`/admin/billing/codes/${id(codeId)}/`);
}

export function generateCodes(request: PromoGenerateRequest): Promise<PromoGenerateAnswer> {
  return api<PromoGenerateAnswer>("/admin/billing/codes/generate/", { method: "POST", body: request });
}

/** Answers with the code's fresh detail. A code already disabled is a 400 `already_disabled`. */
export function disableCode(codeId: string, note: string): Promise<PromoCodeDetail> {
  return api<PromoCodeDetail>(`/admin/billing/codes/${id(codeId)}/disable/`, { method: "POST", body: { note: note.trim() } });
}

/** Disables the batch and every code in it not yet disabled. */
export function disableBatch(batchId: string, note: string): Promise<{ batch: unknown; disabled: number }> {
  return api(`/admin/billing/batches/${id(batchId)}/disable/`, { method: "POST", body: { note: note.trim() } });
}

/** A batch's codes as the server's CSV (signed in like every admin call). */
export function codesCsv(batchId: string): Promise<Blob> {
  return apiFile(`/admin/billing/codes.csv?batch=${id(batchId)}`);
}
