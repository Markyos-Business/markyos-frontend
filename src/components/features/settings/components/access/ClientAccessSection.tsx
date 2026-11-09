"use client";

import { useApp } from "@/contexts/AppContext";
import { Button, CopyButton, Icon, Row, Section, Switch } from "@/components/ui";
import { InputField } from "@/components/form";
import type { Workspace } from "@/types";
import { randomPassword } from "../../utils/random";

/** The password in front of the client link, and the link itself. */
export function ClientAccessSection({ ws, clientLink, isAr }: { ws: Workspace; clientLink: string; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { toggleClientPassword, setClientPassword } = useApp();
  const { password, passwordEnabled } = ws.clientAccess;
  return (
    <Section title={t("Client access", "وصول العميل")} icon="lock">
      <Row
        label={t("Password-protect this guideline", "حماية الدليل بكلمة مرور")}
        hint={t("Clients enter this password before viewing the client link.", "يُدخل العميل كلمة المرور هذه قبل فتح الرابط.")}
        right={<Switch label={t("Password-protect this guideline", "حماية الدليل بكلمة مرور")} checked={passwordEnabled} onToggle={() => toggleClientPassword(ws.id, !passwordEnabled)} />}
      />
      {passwordEnabled && (
        <div className="flex items-end gap-2.5">
          <InputField label={t("Password", "كلمة المرور")} value={password} onChange={(e) => setClientPassword(ws.id, e.target.value)} placeholder={t("Set a password", "عيّن كلمة مرور")} />
          {/* Shown in the clear on purpose — the studio reads it out to a
              client — so it gets a Copy, like the client link below. */}
          <CopyButton
            variant="soft"
            size="md"
            text={password}
            disabled={!password}
            label={t("Copy", "نسخ")}
            copiedLabel={t("Copied", "تم النسخ")}
            copiedMessage={t("Password copied.", "تم نسخ كلمة المرور.")}
            failedMessage={t("Couldn't copy. Select it and copy it by hand.", "تعذّر النسخ. حدّده وانسخه يدويًا.")}
            className="shrink-0"
          />
          <Button variant="soft" onClick={() => setClientPassword(ws.id, randomPassword())} title={t("Replace it with a new random one", "استبدلها بأخرى عشوائية")} className="shrink-0 shadow-edge">
            {t("Generate", "توليد")}
          </Button>
        </div>
      )}
      <div className="mk-surface flex items-center gap-2.5 rounded-lg bg-surface-2 px-3.5 py-3">
        <Icon name="link" size={17} className="text-accent-text" />
        <span
          // The full link in a title: this truncates on a narrow window, and a
          // URL you can only read most of is a URL you cannot check.
          title={clientLink}
          dir="ltr"
          className="min-w-0 flex-1 truncate font-mono text-[12px] text-text-secondary"
        >
          {clientLink}
        </span>
        <CopyButton
          variant="link"
          text={clientLink}
          label={t("Copy", "نسخ")}
          copiedLabel={t("Copied", "تم النسخ")}
          copiedMessage={t("Client link copied.", "تم نسخ رابط العميل.")}
          failedMessage={t("Couldn't copy. Select it and copy it by hand.", "تعذّر النسخ. حدّده وانسخه يدويًا.")}
          className="shrink-0"
        />
      </div>
    </Section>
  );
}
