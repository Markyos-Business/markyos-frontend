import { Button, Row, Section } from "@/components/ui";
import type { Workspace } from "@/types";

/** Guideline site design lives in the Guidelines editor; this points there. */
export function GuidelineDesignSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <Section title={t("Guideline site design", "تصميم موقع الدليل")} icon="layer-group">
      <Row
        label={t("Style, pages, and prebuilt sections", "النمط والصفحات والأقسام الجاهزة")}
        hint={t("Pick Vault, Docs, or Studio, add extra pages, and drop in prebuilt sections — all editable afterward.", "اختر Vault أو Docs أو Studio، وأضف صفحات، وضع أقسامًا جاهزة، وكلها قابلة للتعديل لاحقًا.")}
        right={
          <Button variant="soft" size="xs" href={`/w/${ws.slug}/builder`} className="shrink-0">
            {t("Open editor", "فتح المحرر")}
          </Button>
        }
      />
    </Section>
  );
}
