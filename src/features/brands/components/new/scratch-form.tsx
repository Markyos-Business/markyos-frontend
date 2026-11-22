import type { FormEvent } from "react";
import { Button, PageHeader } from "@/components/ui";
import { InputField } from "@/components/ui";
import { slugify } from "@/lib/utils";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

type ScratchFormProps = {
  title: string;
  description: string;
  name: string;
  onName: (name: string) => void;
  onSubmit: (e: FormEvent) => void;
};

/** A new, empty brand: just its name. */
export function ScratchForm({ title, description, name, onName, onSubmit }: ScratchFormProps) {
  const { isAr } = useInterfaceLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <PageHeader title={title} description={description} className="mb-[26px]" />
      <div className="mb-[26px]">
        <InputField
          // A visible label, not only an aria-label: the heading asks for a
          // brand, but the field itself should say what goes in it.
          label={t("Brand name", "اسم العلامة")}
          // A client's brand, which is what a studio makes here, not the
          // studio's own name.
          placeholder={t("Wadi Rum Coffee", "قهوة وادي رم")}
          dir="auto"
          value={name}
          onChange={(e) => onName(e.target.value)}
          hint={`markyos.com/${slugify(name || "your-brand")}`}
        />
      </div>
      <Button type="submit" variant="primary" disabled={!name.trim()}>
        {t("Create brand", "إنشاء العلامة")}
      </Button>
    </form>
  );
}
