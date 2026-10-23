"use client";

import { Icon } from "@/components/ui";
import { DepartmentView, SectionKey, Workspace } from "@/types";
import { DocSurface, docTokens } from "@/components/features/guideline-site/components/documents/StrategyDocument";

/**
 * A department's instruction page, rendered as something a new hire can read
 * top to bottom.
 *
 * Its body comes from whatever the studio gave it — a handbook parsed into its
 * own headings, or text typed in the hub. Underneath, the brand rules the
 * department picked are resolved live from Strategy and the guideline
 * sections, so a change to the voice matrix reaches every department that
 * cited it without anyone re-editing this page.
 */

const SECTION_LABELS: Record<SectionKey, { label: string; arLabel: string; icon: string }> = {
  overview: { label: "Overview", arLabel: "نظرة عامة", icon: "file-alt" },
  logo: { label: "Logo system", arLabel: "الشعار", icon: "shapes" },
  color: { label: "Color", arLabel: "الألوان", icon: "palette" },
  typography: { label: "Typography", arLabel: "الخطوط", icon: "font" },
};

export interface ResolvedDeptItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  note?: string;
  /** True when the thing this pointed at has since been deleted. */
  dangling: boolean;
}

/** Resolves a department's curated items against the live workspace. */
export function resolveDeptItems(ws: Workspace, view: DepartmentView, isAr: boolean): ResolvedDeptItem[] {
  return view.items.map((item) => {
    if (item.itemType === "section" && item.sectionKey) {
      const meta = SECTION_LABELS[item.sectionKey];
      return {
        id: item.id,
        icon: meta.icon,
        title: isAr ? meta.arLabel : meta.label,
        body: isAr ? "قسم من دليل الهوية" : "A section of the brand guideline",
        note: item.relevanceNote,
        dangling: false,
      };
    }
    if (item.itemType === "purpose") {
      return {
        id: item.id,
        icon: "bullseye",
        title: isAr ? "الغاية" : "Purpose",
        body: ws.strategy.purpose || (isAr ? "لم تُكتب بعد." : "Not written yet."),
        note: item.relevanceNote,
        dangling: false,
      };
    }
    if (item.itemType === "mission") {
      return {
        id: item.id,
        icon: "bullseye",
        title: isAr ? "الرسالة" : "Mission",
        body: ws.strategy.mission || (isAr ? "لم تُكتب بعد." : "Not written yet."),
        note: item.relevanceNote,
        dangling: false,
      };
    }
    if (item.itemType === "persona") {
      const p = ws.strategy.personas.find((x) => x.id === item.refId);
      return {
        id: item.id,
        icon: "users",
        title: p ? p.name : isAr ? "شخصية محذوفة" : "Persona (removed)",
        body: p
          ? [p.role, p.description].filter(Boolean).join(" — ")
          : isAr
            ? "لم تعد هذه الشخصية موجودة في الاستراتيجية."
            : "This persona no longer exists in Strategy.",
        note: item.relevanceNote,
        dangling: !p,
      };
    }
    const t = ws.strategy.voiceTraits.find((x) => x.id === item.refId);
    return {
      id: item.id,
      icon: "quote-right",
      title: t ? t.trait : isAr ? "سمة نبرة محذوفة" : "Voice trait (removed)",
      body: t
        ? t.doExample
        : isAr
          ? "لم تعد هذه السمة موجودة في الاستراتيجية."
          : "This voice trait no longer exists in Strategy.",
      note: item.relevanceNote,
      dangling: !t,
    };
  });
}

/** Whether this department has anything worth publishing. */
export function departmentHasContent(view: DepartmentView): boolean {
  return !!view.guidelineText.trim() || view.instructionSections.length > 0 || view.items.length > 0;
}

export function DepartmentDocument({
  ws,
  view,
  isAr,
  surface = "app",
  idPrefix = "dept-",
}: {
  ws: Workspace;
  view: DepartmentView;
  isAr: boolean;
  surface?: DocSurface;
  idPrefix?: string;
}) {
  const t = docTokens(surface);
  const resolved = resolveDeptItems(ws, view, isAr);
  const file = view.guidelineFileAssetId ? ws.assets.find((a) => a.id === view.guidelineFileAssetId) : undefined;

  if (!departmentHasContent(view)) {
    return (
      <p className="text-[14px]" style={{ color: t.faint }}>
        {isAr
          ? "لا يوجد محتوى لهذا القسم بعد."
          : "Nothing written for this department yet — import a handbook or type its instructions."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {view.guidelineText.trim() && (
        <div className="flex flex-col gap-3">
          {view.guidelineText.split(/\n{2,}/).filter((p) => p.trim()).map((p, i) => (
            <p
              key={i}
              dir="auto"
              className="bidi-auto text-[15.5px] leading-[1.75] max-w-[68ch]"
              style={{ color: t.text }}
            >
              {p}
            </p>
          ))}
        </div>
      )}

      {view.instructionSections.map((sec, i) => (
        <section key={sec.id} id={`${idPrefix}${sec.id}`} className="flex flex-col gap-3 scroll-mt-24">
          <div className="flex items-baseline gap-3">
            <span
              className="text-[11px] font-semibold shrink-0"
              style={{ fontFamily: "ui-monospace, Menlo, monospace", color: t.accent }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 dir="auto" className="bidi-auto text-[17px] font-semibold tracking-tight" style={{ color: t.text }}>
              {sec.heading}
            </h3>
          </div>
          <div className="flex flex-col gap-2.5 ps-7">
            {sec.body.split(/\n{2,}/).filter((p) => p.trim()).map((p, pi) => (
              <p
                key={pi}
                dir="auto"
                className="bidi-auto text-[14.5px] leading-[1.75] max-w-[68ch]"
                style={{ color: t.muted }}
              >
                {p}
              </p>
            ))}
          </div>
        </section>
      ))}

      {resolved.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3
            className="text-[11px] font-semibold uppercase"
            style={{ letterSpacing: ".1em", color: t.faint }}
          >
            {isAr ? "قواعد العلامة التي تنطبق هنا" : "Brand rules that apply here"}
          </h3>
          <div className="flex flex-col gap-2">
            {resolved.map((r) => (
              <div key={r.id} className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: t.surface1 }}>
                <Icon
                  name={r.icon}
                  size={15}
                  style={{ color: r.dangling ? t.faint : t.accent, marginTop: 2, flexShrink: 0 }}
                />
                <div className="flex-1 min-w-0">
                  <div dir="auto" className="bidi-auto text-[13.5px] font-medium" style={{ color: t.text }}>
                    {r.title}
                  </div>
                  <div dir="auto" className="bidi-auto text-[13px] mt-0.5 leading-[1.6]" style={{ color: t.muted }}>
                    {r.body}
                  </div>
                  {r.note && (
                    <div dir="auto" className="bidi-auto text-[12px] mt-1.5" style={{ color: t.faint }}>
                      {isAr ? "لماذا: " : "Why: "}
                      {r.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11.5px]" style={{ color: t.faint }}>
            {isAr
              ? "هذه القواعد تُقرأ مباشرة من الاستراتيجية — تعديلها هناك يحدّث هذه الصفحة تلقائيًا."
              : "These are read live from Strategy — editing them there updates this page automatically."}
          </p>
        </section>
      )}

      {file && (
        <a
          href={file.url}
          download={file.fileName}
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 self-start"
          style={{ background: t.surface1, color: t.text }}
        >
          <Icon name="download" size={14} style={{ color: t.accent }} />
          <span className="text-[13px] font-medium">{file.fileName}</span>
        </a>
      )}
    </div>
  );
}
