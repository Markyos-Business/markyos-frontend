import { Button, Row, Section } from "@/components/ui";
import type { Workspace } from "@/types";

/** Guideline site design lives in the Guidelines editor; this points there. */
export function GuidelineDesignSection({ ws }: { ws: Workspace }) {
  return (
    <Section title="Guideline site design" icon="layer-group">
      <Row
        label="Style, pages, and prebuilt sections"
        hint="Pick Vault, Docs, or Studio, add extra pages, and drop in prebuilt sections — all editable afterward."
        right={
          <Button variant="soft" size="xs" href={`/w/${ws.slug}/builder`} className="shrink-0">
            Open editor →
          </Button>
        }
      />
    </Section>
  );
}
