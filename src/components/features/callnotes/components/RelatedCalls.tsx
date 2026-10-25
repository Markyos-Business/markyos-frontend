"use client";

import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { formatDay } from "@/components/features/discovery";
import { useRequest } from "@/hooks/useRequest";
import { KIND_META } from "../constants";
import { listNotes } from "../services/callNotesService";
import { callDay } from "../utils/format";
import { callHref } from "./DiscoveryView";

type RelatedCallsProps = { brandId: string; brandSlug: string; formId: string; isAr: boolean };

/** The calls linked to a form, beside its answers. */
export function RelatedCalls({ brandId, brandSlug, formId, isAr }: RelatedCallsProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { data } = useRequest(() => listNotes({ brand: brandId, form: formId }), `${brandId}:${formId}`);
  const notes = data?.results ?? [];

  return (
    <section aria-label={t("Related calls", "المكالمات المرتبطة")} className="mk-surface flex flex-col gap-space-5 rounded-card bg-surface-1 p-space-8 print:hidden">
      <h2 className="text-h5 font-medium">{t("Related calls", "المكالمات المرتبطة")}</h2>
      {notes.length === 0 ? (
        <p className="text-caption text-text-muted">{t("No calls linked to this form.", "لا مكالمات مرتبطة بهذا النموذج.")}</p>
      ) : (
        <ul className="flex flex-col gap-space-4">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-space-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-on-soft">
                <Icon name="phone" size={16} />
              </span>
              <span className="flex min-w-0 flex-col items-start">
                <Link href={callHref(brandSlug, n.id)} className="bidi-plain max-w-full truncate text-body font-medium text-text hover:text-accent-text">
                  {n.title}
                </Link>
                <span className="text-caption text-text-muted">
                  {formatDay(callDay(n.callDate), isAr)} · {KIND_META[n.kind][isAr ? "ar" : "en"]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Button variant="link" href={`/w/${brandSlug}/discovery/calls/new`}>
        <Icon name="plus" size={16} />
        {t("Add call notes", "إضافة ملاحظات مكالمة")}
      </Button>
    </section>
  );
}
