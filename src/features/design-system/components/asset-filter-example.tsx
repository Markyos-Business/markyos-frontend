"use client";

import { useState } from "react";
import { z } from "zod";
import { ChipSelector, FilterForm, FormField, InputField, Select } from "@/components/ui";

type Tr = (en: string, ar: string) => string;

const schema = z.object({ q: z.string(), type: z.string(), status: z.array(z.string()), owner: z.string() });
type AssetFilters = z.input<typeof schema>;
const DEFAULTS: AssetFilters = { q: "", type: "", status: [], owner: "" };

const ASSETS = [
  { name: "Ramadan hero banner", type: "image", status: "approved", owner: "nour" },
  { name: "Eid teaser", type: "video", status: "review", owner: "omar" },
  { name: "Riyadh store poster", type: "image", status: "draft", owner: "lina" },
  { name: "Brand guidelines 2027", type: "document", status: "approved", owner: "nour" },
  { name: "Dubai launch reel", type: "video", status: "approved", owner: "omar" },
  { name: "Cairo billboard", type: "image", status: "review", owner: "lina" },
  { name: "Menu card", type: "document", status: "draft", owner: "omar" },
  { name: "Jeddah pop-up", type: "image", status: "approved", owner: "lina" },
];

/** Filters for an asset table, kept in the URL; the list below follows them. */
const AssetFilterExample = ({ t }: { t: Tr }) => {
  const [filters, setFilters] = useState<AssetFilters>(DEFAULTS);
  const shown = ASSETS.filter(
    (a) =>
      (!filters.q || a.name.toLowerCase().includes(filters.q.toLowerCase())) &&
      (!filters.type || a.type === filters.type) &&
      (!filters.status.length || filters.status.includes(a.status)) &&
      (!filters.owner || a.owner === filters.owner),
  );
  return (
    <div className="flex flex-col gap-space-6">
      <FilterForm label={t("Filter assets", "تصفية الملفات")} schema={schema} defaults={DEFAULTS} onApply={setFilters}>
        <FormField<AssetFilters, "q"> name="q" render={({ field, id }) => <InputField label={t("Search", "بحث")} id={id} icon="search" placeholder={t("Asset name", "اسم الملف")} className="sm:w-56" {...field} />} />
        <FormField<AssetFilters, "type">
          name="type"
          render={({ field, id }) => (
            <Select
              id={id}
              label={t("Type", "النوع")}
              placeholder={t("Any type", "أي نوع")}
              className="sm:w-44"
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { value: "image", label: t("Image", "صورة") },
                { value: "video", label: t("Video", "فيديو") },
                { value: "document", label: t("Document", "مستند") },
              ]}
            />
          )}
        />
        <FormField<AssetFilters, "owner">
          name="owner"
          render={({ field, id }) => (
            <Select
              id={id}
              label={t("Owner", "المسؤول")}
              placeholder={t("Anyone", "أي شخص")}
              className="sm:w-44"
              value={field.value}
              onValueChange={field.onChange}
              options={[
                { value: "nour", label: "Nour Haddad" },
                { value: "omar", label: "Omar Aziz" },
                { value: "lina", label: "Lina Mansour" },
              ]}
            />
          )}
        />
        <FormField<AssetFilters, "status">
          name="status"
          render={({ field }) => (
            <ChipSelector
              multiple
              label={t("Status", "الحالة")}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "draft", label: t("Draft", "مسودة") },
                { value: "review", label: t("In review", "قيد المراجعة") },
                { value: "approved", label: t("Approved", "معتمد") },
              ]}
            />
          )}
        />
      </FilterForm>
      <p role="status" className="text-caption text-text-muted">
        {t(`Showing ${shown.length} of ${ASSETS.length} assets`, `يظهر ${shown.length} من ${ASSETS.length} ملفات`)}
      </p>
      <ul className="flex flex-col gap-space-2">
        {shown.map((a) => (
          <li key={a.name} className="flex items-center justify-between gap-space-4 rounded-lg bg-surface-2 px-space-5 py-space-3 text-body shadow-edge">
            <span dir="auto">{a.name}</span>
            <span className="text-caption text-text-muted">
              {a.type} · {a.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { AssetFilterExample };
