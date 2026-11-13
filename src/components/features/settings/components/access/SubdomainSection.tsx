"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, Icon, Section, useToast } from "@/components/ui";
import { InputField } from "@/components/form";
import { suggestSubdomain, validateSubdomain } from "@/components/features/sharing";
import type { Workspace } from "@/types";

/**
 * Choosing the label in front of `.markyos.app` — the address before any
 * custom domain exists.
 *
 * Availability is checked as you type rather than on submit: the difficulty of
 * picking a name is not knowing which ones are gone. The check is against the
 * brands in this account, and the hint says exactly that.
 */
export function SubdomainSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { state, setSubdomain } = useApp();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(ws.clientAccess.subdomain);
  const [saved, setSaved] = useState(ws.clientAccess.subdomain);

  const value = draft.trim().toLowerCase();
  const unchanged = value === saved;
  // Format first, then availability: "already taken" on a string with a space
  // in it is the wrong complaint.
  const formatError = value ? validateSubdomain(value) : null;
  const taken = !formatError && !!value && state.workspaces.some((w) => w.id !== ws.id && w.clientAccess.subdomain.toLowerCase() === value);
  const error = formatError ?? (taken ? t("Already used by another brand in your account.", "مستخدم لعلامة أخرى في حسابك.") : null);
  const available = !!value && !error && !unchanged;
  const invalid = !!error && !unchanged;

  function commit() {
    if (!value) {
      const failed = setSubdomain(ws.id, "");
      if (!failed) {
        setSaved("");
        showToast(t("Subdomain cleared — the client link falls back to the default.", "مُسح النطاق الفرعي، ويعود رابط العميل إلى الافتراضي."), "success");
      }
      return;
    }
    const failed = setSubdomain(ws.id, value);
    if (failed) {
      showToast(failed, "danger");
      return;
    }
    setSaved(value);
    setDraft(value);
    showToast(isAr ? `تم حجز ${value}.markyos.app.` : `Claimed ${value}.markyos.app.`, "success");
  }

  return (
    <Section title={t("Subdomain", "النطاق الفرعي")} icon="link">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-end gap-2.5">
          <InputField
            label={t("Subdomain", "النطاق الفرعي")}
            value={draft}
            dir="ltr"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setDraft(saved);
            }}
            placeholder={suggestSubdomain(ws.name)}
            error={value && !unchanged ? (error ?? undefined) : undefined}
          />
          <Button
            variant="solid"
            onClick={commit}
            disabled={unchanged || (!!value && !!error)}
            // The field's own error covers the invalid case on screen, but not
            // the *unchanged* one, where the button is off and nothing is wrong.
            title={
              unchanged
                ? saved
                  ? isAr ? `${saved}.markyos.app محجوز بالفعل.` : `${saved}.markyos.app is already claimed.`
                  : t("Type a subdomain to claim.", "اكتب نطاقًا فرعيًا لحجزه.")
                : error
                  ? error
                  : value
                    ? isAr ? `حجز ${value}.markyos.app` : `Claim ${value}.markyos.app`
                    : t("Clear the subdomain", "مسح النطاق الفرعي")
            }
            className="shrink-0"
          >
            {value ? t("Claim", "حجز") : t("Clear", "مسح")}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <Icon
            name={available ? "check-circle" : invalid ? "exclamation-circle" : "globe"}
            size={13}
            className={available ? "text-success" : invalid ? "text-danger" : "text-text-faint"}
          />
          <span dir="ltr" className="font-mono text-text-secondary">
            {value || suggestSubdomain(ws.name)}.markyos.app
          </span>
          {available && <span className="text-success">{t("available", "متاح")}</span>}
          {saved && unchanged && <span className="text-text-faint">{t("claimed", "محجوز")}</span>}
        </div>

        <span className="text-[12px] text-text-faint">
          {t("Checked against every brand in your account. Leave it empty and the client link stays", "يُتحقق منه مقابل كل علامات حسابك. اتركه فارغًا ويبقى رابط العميل")}{" "}
          <span dir="ltr" className="font-mono">/v/{ws.slug}</span>.{" "}
          {t(
            "Your preferred address is saved here. Keep using the Markyos link until this address is activated.",
            "حُفظ العنوان الذي تفضّله هنا. استخدم رابط ماركيوس إلى أن يُفعَّل هذا العنوان."
          )}
        </span>
      </div>
    </Section>
  );
}
