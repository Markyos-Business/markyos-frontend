"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, CopyButton, Row, Section, useToast } from "@/components/ui";
import { InputField } from "@/components/form";
import type { Workspace } from "@/types";
import { randomApiKey } from "../../utils/random";

/** The workspace's API key, an example call, and the webhook address. */
export function DeveloperSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { setApiKey, setWebhookUrl } = useApp();
  const { showToast } = useToast();
  const [webhook, setWebhook] = useState(ws.developer.webhookUrl);
  const { apiKey } = ws.developer;
  return (
    <Section title={t("Developer", "المطوّرون")} icon="key">
      <Row
        label={t("API key", "مفتاح API")}
        hint={t("Read-only access to this workspace's published assets and brand data.", "وصول للقراءة فقط إلى أصول هذه المساحة المنشورة وبيانات علامتها.")}
        right={
          <div className="flex items-center gap-2">
            <code dir="ltr" className="rounded-md bg-surface-2 px-2.5 py-1.5 font-mono text-[12px]">{apiKey}</code>
            <CopyButton
              variant="link"
              text={apiKey}
              label={t("Copy", "نسخ")}
              copiedLabel={t("Copied", "تم النسخ")}
              copiedMessage={t("API key copied.", "تم نسخ مفتاح API.")}
              failedMessage={t("Couldn't copy. Select it and copy it by hand.", "تعذّر النسخ. حدّده وانسخه يدويًا.")}
            />
            <button
              type="button"
              onClick={() => {
                setApiKey(ws.id, randomApiKey());
                showToast(t("API key regenerated — the old key stops working immediately.", "أُعيد توليد المفتاح، ويتوقف القديم عن العمل فورًا."));
              }}
              className="mk-tap cursor-pointer text-[12px] font-semibold text-text-muted"
            >
              {t("Regenerate", "إعادة توليد")}
            </button>
          </div>
        }
      />
      <div dir="ltr" className="overflow-x-auto rounded-lg bg-surface-2 px-3.5 py-3 font-mono text-[12px] text-text-secondary">
        curl https://api.markyos.com/v1/workspaces/{ws.slug} \{"\n"}
        {"  "}-H &quot;Authorization: Bearer {apiKey}&quot;
      </div>
      <div className="flex items-end gap-2.5">
        <InputField
          label={t("Webhook URL", "رابط Webhook")}
          dir="ltr"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="https://yourapp.com/webhooks/markyos"
          hint={t("Fires on publish, approval and sign-off events. Not sent anywhere yet in this demo.", "يُرسل عند النشر والموافقة والاعتماد. لا يُرسل إلى أي مكان بعد في هذه النسخة.")}
        />
        <Button
          variant="soft"
          onClick={() => {
            setWebhookUrl(ws.id, webhook.trim());
            showToast(t("Webhook URL saved.", "حُفظ رابط Webhook."));
          }}
          className="shrink-0 shadow-edge"
        >
          {t("Save", "حفظ")}
        </Button>
      </div>
    </Section>
  );
}
