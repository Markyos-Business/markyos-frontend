"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormDialog, InputField, SegmentedControl } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/errorText";
import { createHelpArticle } from "../../api/help.api";
import { useHelpCopy } from "../../hooks/use-help-copy";
import type { HelpLocale } from "../../types";

const toSlug = (locale: HelpLocale, text: string) =>
  locale === "en"
    ? text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : text.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

/** Starts a draft with a title in one language, then opens the editor. */
export function NewArticleDialog({ onClose }: { onClose: () => void }) {
  const { h, lang } = useHelpCopy();
  const t = h.articles.create;
  const router = useRouter();
  const [locale, setLocale] = useState<HelpLocale>(lang);
  const [title, setTitle] = useState("");
  return (
    <FormDialog
      open
      title={t.title}
      submitLabel={t.submit}
      onClose={onClose}
      onSubmit={async () => {
        try {
          const doc = await createHelpArticle(locale, title.trim(), toSlug(locale, title));
          router.push(`/admin/cms/help/articles/${doc.id}`);
        } catch (e: unknown) {
          const fields = e instanceof ApiError ? (e.data as { fields?: Record<string, string> } | null)?.fields : undefined;
          if (fields?.[`${locale}.slug`]) return h.editor.errors.slug;
          if (e instanceof ApiError && e.status === 400) return h.editor.errors.title;
          return errorText(e, lang);
        }
      }}
    >
      <SegmentedControl<HelpLocale>
        label={t.language}
        value={locale}
        onChange={setLocale}
        options={[{ value: "en", label: h.articles.language.en }, { value: "ar", label: h.articles.language.ar }]}
      />
      <InputField label={t.titleLabel} value={title} required dir={locale === "ar" ? "rtl" : "ltr"} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
    </FormDialog>
  );
}
