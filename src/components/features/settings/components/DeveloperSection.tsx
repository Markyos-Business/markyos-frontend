"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, Row, Section, useToast } from "@/components/ui";
import { InputField } from "@/components/form";
import type { Workspace } from "@/types";
import { useCopy } from "../hooks/useCopy";
import { randomApiKey } from "../utils/random";

/** The workspace's API key, an example call, and the webhook address. */
export function DeveloperSection({ ws }: { ws: Workspace }) {
  const { setApiKey, setWebhookUrl } = useApp();
  const { showToast } = useToast();
  const copy = useCopy();
  const [webhook, setWebhook] = useState(ws.developer.webhookUrl);
  const { apiKey } = ws.developer;
  return (
    <Section title="Developer" icon="key">
      <Row
        label="API key"
        hint="Read-only access to this workspace's published assets and brand data."
        right={
          <div className="flex items-center gap-2">
            <code className="rounded-md bg-surface-2 px-2.5 py-1.5 font-mono text-[12px]">{apiKey}</code>
            <Button variant="link" onClick={() => void copy(apiKey, "API key")} className="text-[12px] font-semibold">
              Copy
            </Button>
            <button
              type="button"
              onClick={() => {
                setApiKey(ws.id, randomApiKey());
                showToast("API key regenerated — the old key stops working immediately.");
              }}
              className="mk-tap cursor-pointer text-[12px] font-semibold text-text-muted"
            >
              Regenerate
            </button>
          </div>
        }
      />
      <div className="overflow-x-auto rounded-lg bg-surface-2 px-3.5 py-3 font-mono text-[12px] text-text-secondary">
        curl https://api.markyos.com/v1/workspaces/{ws.slug} \{"\n"}
        {"  "}-H &quot;Authorization: Bearer {apiKey}&quot;
      </div>
      <div className="flex items-end gap-2.5">
        <InputField
          label="Webhook URL"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="https://yourapp.com/webhooks/markyos"
          hint="Fires on publish, approval and sign-off events. Not sent anywhere yet in this demo."
        />
        <Button
          variant="soft"
          onClick={() => {
            setWebhookUrl(ws.id, webhook.trim());
            showToast("Webhook URL saved.");
          }}
          className="shrink-0 shadow-edge"
        >
          Save
        </Button>
      </div>
    </Section>
  );
}
