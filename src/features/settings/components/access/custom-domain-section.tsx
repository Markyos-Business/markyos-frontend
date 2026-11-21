"use client";

import { Badge, Button, Section, useToast } from "@/components/ui";
import type { Workspace } from "@/types";

/*
 * Custom domain: not available yet (review, 21 Nov 2026).
 *
 * This section used to save a domain and then mark it "Verified" after a
 * timer: nothing checked DNS, and nothing routed the domain to the site, so
 * a studio could believe its client's domain worked when it never could.
 * Real support needs DNS verification, the hosting provider's domain setup
 * and routing by host name, which are production changes. Until then the
 * section says so plainly and points to the link that does work.
 */
const COPY = {
  en: {
    title: "Custom domain",
    soon: "Coming soon",
    body: "Serving the guideline site on your own domain isn't available yet. Share its Markyos link with clients for now.",
    copy: "Copy the guideline link",
    copied: "Guideline link copied.",
    failed: "Couldn't copy. Open the site and copy the link from the address bar.",
  },
  ar: {
    title: "نطاق خاص",
    soon: "قريبًا",
    body: "عرض موقع الدليل على نطاقك الخاص غير متاح بعد. شارك رابطه على ماركيوس مع العملاء حاليًا.",
    copy: "انسخ رابط الدليل",
    copied: "نُسخ رابط الدليل.",
    failed: "تعذّر النسخ. افتح الموقع وانسخ الرابط من شريط العنوان.",
  },
};

export function CustomDomainSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const c = COPY[isAr ? "ar" : "en"];
  const { showToast } = useToast();
  const path = `/v/${ws.slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      showToast(c.copied, "success");
    } catch {
      showToast(c.failed, "danger");
    }
  }

  return (
    <Section title={c.title} icon="globe" right={<Badge tone="neutral">{c.soon}</Badge>}>
      <p className="-mt-1 text-body text-text-muted">{c.body}</p>
      <div className="mk-field-row flex flex-wrap items-center gap-ctl-row">
        <span dir="ltr" className="min-w-0 truncate font-mono text-caption text-text">{path}</span>
        <Button variant="outline" size="sm" onClick={() => void copyLink()} className="shrink-0">
          {c.copy}
        </Button>
      </div>
    </Section>
  );
}
