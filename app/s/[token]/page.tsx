"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useShareLink } from "@/features/sharing";
import { Icon, LangToggle } from "@/shared/ui";
import {
  CenteredMessage,
  StrategyDocument,
  strategyIsEmpty,
  DepartmentDocument,
} from "@/features/guideline-site";
import { Lang } from "@/core/data/types";

/**
 * A read-only window onto one brand's thinking.
 *
 * Not the guideline site: that is the finished deliverable, gated on a plan and
 * a client password, and it publishes a frozen snapshot. This is for the middle
 * of the work — handing a new hire the strategy, or handing Sales only the page
 * that governs Sales — so it reads the *live* workspace and carries no editor,
 * no navigation into the app, and no way to change anything.
 *
 * It renders the same two document components the studio proofreads with, so
 * what the reader gets is exactly what the studio saw. A revoked link is told
 * apart from a link that never existed, because those deserve different
 * answers: one means "ask them for a new one", the other means "check the URL".
 */
export default function SharePage() {
  const params = useParams<{ token: string }>();
  const { loaded, found } = useShareLink(params.token);
  const [lang, setLang] = useState<Lang>("en");

  if (!loaded) return null;

  const isAr = lang === "ar";

  if (!found) {
    return (
      <CenteredMessage
        icon="unlink"
        title="This link doesn't work"
        arTitle="هذا الرابط لا يعمل"
        body="It may have been mistyped, or it belongs to a brand kept in a different browser. Ask whoever sent it for a fresh link."
        arBody="قد يكون الرابط غير صحيح، أو يخص علامة محفوظة في متصفح آخر. اطلب رابطًا جديدًا ممن أرسله."
        isAr={isAr}
      />
    );
  }

  const { ws, link } = found;
  const department = link.scope === "department" ? ws.departmentViews.find((d) => d.id === link.departmentId) : undefined;

  if (link.revokedAt) {
    return (
      <CenteredMessage
        icon="lock"
        title="This link was switched off"
        arTitle="تم إيقاف هذا الرابط"
        body="The studio revoked it. Ask them to share a new one if you still need access."
        arBody="أوقفه الاستوديو. اطلب منهم رابطًا جديدًا إن كنت ما زلت بحاجة إليه."
        isAr={isAr}
      />
    );
  }

  // A department link whose department has since been deleted. Saying so is
  // better than rendering an empty page that looks like a bug.
  if (link.scope === "department" && !department) {
    return (
      <CenteredMessage
        icon="exclamation-circle"
        title="That department no longer exists"
        arTitle="لم يعد هذا القسم موجودًا"
        body="It was removed from this brand after the link was shared."
        arBody="تمت إزالته من هذه العلامة بعد مشاركة الرابط."
        isAr={isAr}
      />
    );
  }

  const title = department ? department.name : isAr ? "استراتيجية العلامة" : "Brand strategy";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col"
      style={{ background: "var(--canvas)", color: "var(--text)", fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
    >
      <header
        className="h-16 shrink-0 flex items-center gap-4 px-6 md:px-10"
        style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-8 h-8 rounded-lg grid place-items-center text-[12px] font-semibold shrink-0"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            {ws.initials}
          </span>
          <div className="min-w-0">
            <div dir="auto" className="bidi-auto text-[14px] font-semibold truncate">{ws.name}</div>
            <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>
              {isAr ? "للقراءة فقط" : "Read-only"}
            </div>
          </div>
        </div>
        <div className="ms-auto flex items-center gap-3 shrink-0">
          <LangToggle value={lang} onChange={setLang} size="sm" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-[820px] mx-auto px-6 md:px-8 py-10 flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] font-semibold uppercase"
            style={{ letterSpacing: ".1em", color: "var(--text-faint)" }}
          >
            {link.scope === "department"
              ? isAr ? "دليل قسم" : "Department guide"
              : isAr ? "الاستراتيجية" : "Strategy"}
          </span>
          <h1 dir="auto" className="bidi-auto text-[32px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h1>
        </div>

        {department ? (
          <DepartmentDocument ws={ws} view={department} isAr={isAr} surface="app" idPrefix={`share-${link.id}-`} />
        ) : strategyIsEmpty(ws) ? (
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            {isAr
              ? "لم تُكتب الاستراتيجية بعد."
              : "The strategy hasn't been written yet."}
          </p>
        ) : (
          <StrategyDocument ws={ws} isAr={isAr} lang={lang} surface="app" idPrefix={`share-${link.id}-`} />
        )}

        <div className="flex items-center gap-2 pt-4 text-[11.5px]" style={{ color: "var(--text-faint)", boxShadow: "inset 0 1px 0 var(--hairline)" }}>
          <Icon name="eye" size={12} style={{ marginTop: 10 }} />
          <span style={{ marginTop: 10 }}>
            {isAr
              ? "رابط للقراءة فقط. يعرض أحدث نسخة، ويمكن للاستوديو إيقافه في أي وقت."
              : "A read-only link. It shows the current version, and the studio can switch it off at any time."}
          </span>
        </div>
      </main>
    </div>
  );
}
