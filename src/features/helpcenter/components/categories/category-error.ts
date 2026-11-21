import { ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/errorText";
import type { Lang } from "@/types/lang";
import type { HelpCopy } from "../../copy";

/**
 * The server's refusals in the reader's language: its messages are English,
 * so each refusal code and field maps to a keyed message here.
 */
export function categoryError(e: unknown, h: HelpCopy, lang: Lang): string {
  const t = h.categories.errors;
  if (e instanceof ApiError) {
    const code = (e.data as { code?: string } | null)?.code;
    if (code === "has_articles") return t.hasArticles;
    if (code === "has_children") return t.hasChildren;
    if (e.fields.titleEn || e.fields.titleAr) return t.title;
    if (e.fields.slugEn || e.fields.slugAr) return t.slug;
    if (e.fields.parent) return t.parent;
  }
  return errorText(e, lang);
}
