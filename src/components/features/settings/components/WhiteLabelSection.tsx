"use client";

import { useApp } from "@/contexts/AppContext";
import { Row, Section, Switch } from "@/components/ui";
import type { Workspace } from "@/types";

/** Dropping the Markyos footer from the client viewer. */
export function WhiteLabelSection({ ws, typeLabel }: { ws: Workspace; typeLabel: string }) {
  const { toggleWhiteLabel } = useApp();
  return (
    <Section title="White-label" icon="id-badge">
      <Row
        label="Remove Markyos branding"
        hint={`Drops the small 'Guideline delivered with Markyos' footer from the client viewer. Included automatically on the ${typeLabel} plan.`}
        right={
          <Switch
            label="Remove Markyos branding"
            checked={ws.whiteLabel || ws.billing.plan === "subscription"}
            onToggle={() => toggleWhiteLabel(ws.id, !ws.whiteLabel)}
          />
        }
      />
    </Section>
  );
}
