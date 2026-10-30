"use client";

import { useEffect, useState } from "react";
import { AlertBanner, Button, Icon, Skeleton } from "@/components/ui";
import { SearchField } from "@/components/form";
import { CATEGORY_LABELS, CATEGORY_ORDER, TYPE_META } from "../../constants";
import { useLibrary } from "../../hooks/builder/useLibrary";
import { textIn } from "../../model/questionTypes";
import type { QuestionCategory } from "../../types";

type LibraryPanelProps = {
  /** Library ids already in the form: shown as added, not offered twice. */
  added: Set<string>;
  onAdd: (libraryQuestionId: string) => void;
  /** No section to add to, or the form no longer takes new questions. */
  disabled: boolean;
  isAr: boolean;
};

/** The curated question library: search, filter by category, add to the open section. */
export function LibraryPanel({ added, onAdd, disabled, isAr }: LibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<QuestionCategory | "">("");
  const lang = isAr ? "ar" : "en";
  const { data, error, loading } = useLibrary({ search: term, category, pageSize: 100 });

  useEffect(() => {
    const t = window.setTimeout(() => setTerm(search), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  return (
    <aside aria-label={isAr ? "مكتبة الأسئلة" : "Question library"} className="mk-surface flex min-h-0 flex-col rounded-card bg-surface-1">
      <div className="flex flex-col gap-space-5 p-space-6 shadow-rule-b">
        <h2 className="text-h5 font-medium">{isAr ? "مكتبة الأسئلة" : "Question library"}</h2>
        <SearchField
          label={isAr ? "ابحث في المكتبة" : "Search the library"}
          placeholder={isAr ? "ابحث بالعربية أو الإنجليزية…" : "Search in English or Arabic…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div role="group" aria-label={isAr ? "الفئات" : "Categories"} className="flex flex-wrap gap-space-3">
          {(["", ...CATEGORY_ORDER] as (QuestionCategory | "")[]).map((key) => {
            const on = category === key;
            return (
              <button
                key={key || "all"}
                type="button"
                aria-pressed={on}
                onClick={() => setCategory(key)}
                className={`h-8 rounded-md px-space-4 text-caption font-medium transition-[background-color,color,box-shadow] ${
                  on ? "bg-accent-soft text-accent-on-soft shadow-edge-accent" : "bg-surface-2 text-text-muted hover:text-text"
                }`}
              >
                {key ? CATEGORY_LABELS[key][lang] : isAr ? "الكل" : "All"}
              </button>
            );
          })}
        </div>
      </div>

      <AlertBanner message={error} className="m-space-6" />

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {loading && !data
          ? [0, 1, 2, 3].map((i) => (
              <li key={i} className="px-space-6 py-space-5">
                <Skeleton className="h-10 w-full rounded-lg" />
              </li>
            ))
          : data?.results.map((q) => {
              const isAdded = added.has(q.id);
              return (
                <li key={q.id} className="flex items-start gap-space-4 px-space-6 py-space-5 shadow-rule-t first:shadow-none">
                  <Icon name={TYPE_META[q.type].icon} size={16} className="mt-0.5 shrink-0 text-text-muted" />
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="text-body text-text">
                      {textIn(q.title, lang)}
                    </p>
                    <p className="text-caption text-text-muted">{CATEGORY_LABELS[q.category][lang]}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? "outline" : "ghost"}
                    disabled={disabled || isAdded}
                    onClick={() => onAdd(q.id)}
                    icon={<Icon name={isAdded ? "check" : "plus"} size={16} />}
                    aria-label={isAdded ? undefined : `${isAr ? "إضافة" : "Add"}: ${textIn(q.title, lang)}`}
                  >
                    {isAdded ? (isAr ? "مضاف" : "Added") : isAr ? "إضافة" : "Add"}
                  </Button>
                </li>
              );
            })}
        {data && data.results.length === 0 && (
          <li className="px-space-6 py-space-8 text-center text-body text-text-muted">
            {isAr ? `لا أسئلة تطابق «${term}».` : `No questions match "${term}".`}
          </li>
        )}
      </ul>
    </aside>
  );
}
