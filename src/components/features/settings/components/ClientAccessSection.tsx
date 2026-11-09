"use client";

import { useApp } from "@/contexts/AppContext";
import { Button, Icon, Row, Section, Switch } from "@/components/ui";
import { InputField } from "@/components/form";
import type { Workspace } from "@/types";
import { useCopy } from "../hooks/useCopy";
import { randomPassword } from "../utils/random";

/** The password in front of the client link, and the link itself. */
export function ClientAccessSection({ ws, clientLink, isAr }: { ws: Workspace; clientLink: string; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { toggleClientPassword, setClientPassword } = useApp();
  const copy = useCopy();
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
          <Button
            variant="soft"
            onClick={() => void copy(password, t("Password", "كلمة المرور"), isAr)}
            disabled={!password}
            title={password ? t("Copy the password", "نسخ كلمة المرور") : t("Set a password first", "عيّن كلمة مرور أولًا")}
            className="shrink-0 shadow-edge"
          >
            {t("Copy", "نسخ")}
          </Button>
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
        <Button variant="link" onClick={() => void copy(clientLink, t("Client link", "رابط العميل"), isAr)} className="shrink-0 text-[12px] font-semibold">
          {t("Copy", "نسخ")}
        </Button>
      </div>
    </Section>
  );
}
