"use client";

import { useState } from "react";
import { useAccountCopy } from "@/contexts/useAccountCopy";
import { useApp } from "@/contexts/AppContext";
import { Badge, Button, Section, useToast } from "@/components/ui";
import { InputField } from "@/components/form";
import type { Workspace } from "@/types";

/** Mapping the client link to the studio's own domain, and the DNS record that verifies it. */
export function CustomDomainSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const copy = useAccountCopy(isAr);
  const { setCustomDomain, setDomainStatus } = useApp();
  const { showToast } = useToast();
  const [domain, setDomain] = useState(ws.clientAccess.customDomain);
  const [verifying, setVerifying] = useState(false);
  const { customDomain, domainStatus } = ws.clientAccess;

  function connect() {
    const trimmed = domain.trim();
    if (!trimmed) return;
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(trimmed)) {
      showToast(t("Enter a valid domain, like brand.client.com.", "أدخل نطاقًا صحيحًا، مثل brand.client.com."), "danger");
      return;
    }
    setCustomDomain(ws.id, trimmed);
    showToast(t("Domain saved — add the CNAME record below to verify.", "حُفظ النطاق، أضف سجل CNAME أدناه للتحقق."));
  }

  function verify() {
    setVerifying(true);
    window.setTimeout(() => {
      setDomainStatus(ws.id, "verified");
      setVerifying(false);
      showToast(t("Domain verified.", "تم التحقق من النطاق."), "success");
    }, 1100);
  }

  return (
    <Section title={t("Custom domain", "نطاق خاص")} icon="globe">
      <p className="-mt-1 text-[13px] text-text-muted">
        {copy.domainHint}
      </p>
      <div className="flex items-end gap-2.5">
        <InputField label={t("Domain", "النطاق")} dir="ltr" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="brand.client.com" />
        <Button variant="solid" onClick={connect} className="shrink-0">
          {t("Connect", "ربط")}
        </Button>
      </div>
      {domainStatus !== "none" && (
        <div className="flex flex-col gap-3 rounded-card bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <span className="truncate font-mono text-[12px]">{customDomain}</span>
            <Badge tone={domainStatus === "verified" ? "success" : "warning"}>{domainStatus === "verified" ? t("Verified", "تم التحقق") : t("Pending DNS", "بانتظار DNS")}</Badge>
          </div>
          {domainStatus === "pending" && (
            <>
              <div className="grid grid-cols-[80px_1fr] gap-x-4 gap-y-1.5 text-[12px]">
                <span className="text-text-faint">{t("Type", "النوع")}</span>
                <span className="font-mono">CNAME</span>
                <span className="text-text-faint">{t("Name", "الاسم")}</span>
                <span className="font-mono">{customDomain.split(".")[0]}</span>
                <span className="text-text-faint">{t("Value", "القيمة")}</span>
                <span className="font-mono text-accent-text">clients.markyos.app</span>
              </div>
              <Button variant="outline" size="sm" onClick={verify} disabled={verifying} className="self-start">
                {verifying ? t("Checking DNS…", "جارٍ فحص DNS…") : t("I've added the CNAME record", "أضفت سجل CNAME")}
              </Button>
            </>
          )}
        </div>
      )}
    </Section>
  );
}
