"use client";

import { useApp } from "@/contexts/AppContext";
import { ContrastReport } from "@/components/features/guideline-site";
import type { Workspace } from "@/types";
import { SITE_MODES } from "../../constants";
import { Segments } from "../Segments";

/** The ground the client's site is set on, with the contrast it produces right underneath. */
export function SiteTab({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { setSiteMode } = useApp();
  return (
    <div className="flex flex-col gap-2.5">
      <p className="px-1 pb-1 text-[11.5px] text-text-faint">
        {isAr
          ? "الأرضية التي يُبنى عليها موقع العميل. القالب نفسه يُختار من تبويب «القالب»."
          : "The ground the client's site is set on. The template itself is chosen on the Template tab."}
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[10.5px] font-semibold tracking-[0.08em] text-text-faint uppercase">{isAr ? "أرضية الموقع" : "Site ground"}</span>
        <Segments
          options={SITE_MODES.map((m) => ({ value: m.key, label: isAr ? m.ar : m.en }))}
          value={ws.siteMode}
          onChange={(m) => setSiteMode(ws.id, m)}
          textClass="text-[11px]"
        />
        <span className="px-1 text-[11px] text-text-faint">
          {isAr
            ? "«تلقائي» يتبع نظام تصميم القالب المختار — بعض القوالب فاتحة بطبيعتها وبعضها داكن — ويستخدم لونًا باسم Canvas من لوحتك عندما يتوافق معه. هذا يخص موقع العميل فقط — سمة لوحة التحكم منفصلة."
            : "Auto follows the chosen template's design system — some are light systems, some dark — and uses a Canvas swatch from your palette when it agrees. This is the client's site only; your own interface theme is separate."}
        </span>
      </div>

      {/* Switching the ground is the change most likely to break legibility,
          so the consequences sit right under the control that causes them. */}
      <div className="mk-surface rounded-xl bg-surface-1 p-3.5">
        <ContrastReport ws={ws} isAr={isAr} compact />
      </div>
    </div>
  );
}
