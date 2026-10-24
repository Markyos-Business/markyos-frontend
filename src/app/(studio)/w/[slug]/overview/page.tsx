"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast, useDialog, Icon, EditableField } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { BrandMark } from "@/components/ui/media";
import { navLogo } from "@/components/features/guideline-site";
import { useTheme } from "@/contexts/ThemeProvider";
import { Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";

/**
 * Named actions rather than bound callbacks, because "Link" now asks a question
 * through the app's own dialog and has to reach the editor's live selection.
 * The switch that runs them lives in the component, where both are in scope.
 */
const TOOLBAR = [
  { icon: "heading", label: "Heading", action: "heading" },
  { icon: "bold", label: "Bold", action: "bold" },
  { icon: "italic", label: "Italic", action: "italic" },
  { icon: "link", label: "Link", action: "link" },
  { icon: "list-ul", label: "List", action: "list" },
  { icon: "quote-right", label: "Quote", action: "quote" },
] as const;

type ToolbarAction = (typeof TOOLBAR)[number]["action"];

export default function OverviewPage() {
  const params = useParams<{ slug: string }>();
  const { getWorkspace, setOverview, setPrimaryLocale, uiLang } = useApp();
  const { showToast } = useToast();
  const { prompt } = useDialog();
  const ws = getWorkspace(params.slug);
  const editorRef = useRef<HTMLDivElement>(null);
  const [, forceTick] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (editorRef.current && ws) {
      editorRef.current.innerHTML = ws.overviewHtml;
      setWordCount(
        (editorRef.current.textContent || "").trim().split(/\s+/).filter(Boolean).length
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const savedLabel = useMemo(
    () => (ws ? `Saved ${formatRelative(ws.overviewSavedAt)}` : ""),
    [ws]
  );

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";

  function handleInput() {
    if (!editorRef.current || !ws) return;
    const html = editorRef.current.innerHTML;
    setWordCount(
      (editorRef.current.textContent || "").trim().split(/\s+/).filter(Boolean).length
    );
    setOverview(ws.id, html);
  }

  /**
   * `execCommand` works on the live selection, which the dialog takes focus
   * away from — so the range is cloned first and put back before the link is
   * applied. Without that the link would wrap nothing.
   */
  function handleLink() {
    const sel = window.getSelection();
    const saved = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    void (async () => {
      const url = await prompt({
        title: isAr ? "إضافة رابط" : "Add a link",
        label: isAr ? "عنوان الرابط" : "Link URL",
        placeholder: "https://",
        confirmLabel: isAr ? "ربط" : "Link",
        isAr,
      });
      editorRef.current?.focus();
      if (saved) {
        const live = window.getSelection();
        live?.removeAllRanges();
        live?.addRange(saved);
      }
      if (!url) return;
      document.execCommand("createLink", false, url);
      handleInput();
    })();
  }

  function runTool(action: ToolbarAction) {
    editorRef.current?.focus();
    switch (action) {
      case "heading":
        document.execCommand("formatBlock", false, "h2");
        break;
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "list":
        document.execCommand("insertUnorderedList");
        break;
      case "quote":
        document.execCommand("formatBlock", false, "blockquote");
        break;
      case "link":
        handleLink();
        return; // handleLink syncs once the dialog settles.
    }
    handleInput();
  }

  return (
    <>
      <TopBar
        workspace={ws}
        section="Overview"
        arSection="نظرة عامة"
        right={
          <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            {savedLabel}
          </span>
        }
      />
      <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-4">
        {/* Wraps on a narrow window — see the note in BrandFilesContent. */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1
            className="text-[30px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isAr ? "نظرة عامة" : "Overview"}
          </h1>
          <button
            type="button"
            onClick={() => {
              // The brand's own language, not the reader's: this control's own
              // toast calls it the preview, and it decides what a client sees
              // at /v/<slug>.
              setPrimaryLocale(ws.id, isAr ? "en" : "ar");
              showToast(isAr ? "Switched preview to English." : "Switched preview to Arabic.");
            }}
            className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer"
            style={{
              background: "var(--surface-2)",
              boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
            }}
          >
            {isAr ? "Add English version" : "Add Arabic version"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
          <BrandDetailsCard ws={ws} isAr={isAr} />
          <BrandInsightsCard ws={ws} isAr={isAr} />
        </div>

        <div
          className="mk-surface flex-1 min-h-0 rounded-2xl flex flex-col overflow-hidden"
          style={{ background: "var(--surface-1)" }}
        >
          <div
            className="shrink-0 flex items-center gap-1 px-4 py-2.5"
            style={{ boxShadow: "inset 0 -1px 0 var(--hairline)", color: "var(--text-muted)" }}
          >
            {TOOLBAR.map((t) => (
              <button
                key={t.label}
                type="button"
                title={t.label}
                aria-label={t.label}
                // The editor loses its selection the moment a toolbar button
                // takes focus, so the press must not move focus at all.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runTool(t.action)}
                className="p-1.5 rounded-md cursor-pointer hover:text-text"
              >
                <Icon name={t.icon} size={18} />
              </button>
            ))}
            <span className="ms-auto text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}>
              {wordCount} words
            </span>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            dir={isAr ? "rtl" : "ltr"}
            className="flex-1 min-h-0 overflow-auto px-10 py-8 outline-none overview-editor"
            style={{ maxWidth: "74ch", fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
          />
        </div>
      </div>
      <style jsx global>{`
        .overview-editor h2 {
          margin: 0 0 14px;
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: -0.015em;
        }
        .overview-editor p {
          margin: 0 0 16px;
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-secondary);
        }
        .overview-editor blockquote {
          margin: 0;
          padding: 16px 20px;
          /* The accent bar goes on the side the quote starts on, and the
             corners follow it. A physical border-left with a physical radius
             put the bar on the left of an Arabic quote and rounded the wrong
             two corners — the one shape in this editor that has a direction,
             and it pointed the wrong way. */
          border-inline-start: 2px solid var(--accent);
          background: var(--surface-2);
          border-start-start-radius: 0;
          border-end-start-radius: 0;
          border-start-end-radius: 10px;
          border-end-end-radius: 10px;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
        }
        .overview-editor ul {
          margin: 0 0 16px;
          padding-inline-start: 22px;
          color: var(--text-secondary);
        }
        .overview-editor a {
          color: var(--accent);
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}

function BrandDetailsCard({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { setBrandDetails } = useApp();
  const [field, setField] = useState<"industry" | "tagline" | "foundedYear" | null>(null);
  const [draft, setDraft] = useState("");
  const primaryColor = ws.colors.find((c) => c.isPrimary) ?? ws.colors[0];
  // Resolved through navLogo rather than reading slots directly: that helper
  // already knows which lockup a surface should show *and* picks up the
  // brand's own reversed file. Reading `.url` by hand skipped `lightUrl`
  // entirely, so a studio that had uploaded a light version never saw it here.
  const logo = navLogo(ws, isAr);
  const logoUrl = logo.src;
  const logoLightUrl = logo.lightSrc;
  const { resolved } = useTheme();

  function start(f: "industry" | "tagline" | "foundedYear") {
    setField(f);
    setDraft(ws[f]);
  }

  function commit() {
    if (field) setBrandDetails(ws.id, { [field]: draft.trim() });
    setField(null);
  }

  return (
    <div className="mk-surface rounded-2xl p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
      <div className="flex items-center justify-between gap-3">
        <BrandNameField ws={ws} isAr={isAr} />
        <div className="flex items-center gap-2">
          {/* Plated: this snapshot is app chrome, and a brand whose lockup is a
              coloured symbol beside a near-black wordmark rendered here with
              the wordmark invisible on the dark theme. */}
          {logoUrl && (
            <BrandMark
              src={logoUrl}
              lightSrc={logoLightUrl}
              alt=""
              onDark={resolved === "dark"}
              plate
              style={{ height: 22, width: "auto" }}
              fallbackSize={14}
            />
          )}
          {primaryColor && (
            <span
              className="w-5 h-5 rounded-full shrink-0"
              // The ring has to separate the swatch from the card whichever way
              // round the theme is — a white-alpha edge disappears the moment a
              // pale brand colour sits on a white card.
              style={{ background: primaryColor.hex, boxShadow: "inset 0 0 0 1px var(--chip-edge)" }}
              title={primaryColor.name}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <EditableField
          label={isAr ? "الصناعة" : "Industry"}
          placeholder="e.g. Brand & identity design"
          value={field === "industry" ? draft : ws.industry}
          editing={field === "industry"}
          onStart={() => start("industry")}
          onChange={setDraft}
          onCommit={commit}
        />
        <EditableField
          label={isAr ? "الشعار الترويجي" : "Tagline"}
          placeholder="A short line that sums up the brand"
          value={field === "tagline" ? draft : ws.tagline}
          editing={field === "tagline"}
          onStart={() => start("tagline")}
          onChange={setDraft}
          onCommit={commit}
        />
        <EditableField
          label={isAr ? "سنة التأسيس" : "Founded"}
          placeholder="e.g. 2019"
          value={field === "foundedYear" ? draft : ws.foundedYear}
          editing={field === "foundedYear"}
          onStart={() => start("foundedYear")}
          onChange={setDraft}
          onCommit={commit}
        />
      </div>
    </div>
  );
}

/**
 * The brand's name, editable in place.
 *
 * It was set once at creation and never again, which made a typo permanent.
 * Renaming leaves the slug alone on purpose — that's the client-facing URL and
 * may already be in a proposal — so the hint says what does and doesn't change
 * rather than letting someone discover it by breaking a shared link.
 */
function BrandNameField({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { renameWorkspace } = useApp();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft !== null && draft.trim() && draft.trim() !== ws.name) {
      renameWorkspace(ws.id, draft);
      showToast(isAr ? "تمت إعادة التسمية." : `Renamed to ${draft.trim()}. The client link is unchanged.`, "success");
    }
    setDraft(null);
  }

  if (draft !== null) {
    return (
      <input
        autoFocus
        dir="auto"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setDraft(null);
        }}
        aria-label={isAr ? "اسم العلامة" : "Brand name"}
        className="flex-1 min-w-0 h-8 px-2 rounded-md outline-none font-semibold text-[14px] bidi-auto"
        style={{ background: "var(--surface-2)", color: "var(--text)", boxShadow: "inset 0 0 0 1px rgba(0,153,255,.5)" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDraft(ws.name)}
      title={isAr ? "إعادة تسمية العلامة" : "Rename this brand — the client link stays the same"}
      className="mk-tap gap-2 min-w-0 cursor-pointer text-start"
    >
      <span dir="auto" className="font-semibold text-[14px] truncate bidi-auto">{ws.name}</span>
      <Icon name="pen" size={11} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
    </button>
  );
}

function BrandInsightsCard({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const logoFilled = Object.values(ws.logo).filter((s) => s.phase === "attached").length;
  const strategyFieldsFilled = [
    ws.strategy.purpose,
    ws.strategy.vision,
    ws.strategy.mission,
    ws.strategy.targetAudienceSummary,
    ws.strategy.positioningStatement,
    ws.strategy.uvp,
  ].filter((v) => v.trim().length > 0).length + (ws.strategy.coreValues.length > 0 ? 1 : 0) + (ws.strategy.voiceTraits.length > 0 ? 1 : 0);

  const rows: { label: string; arLabel: string; value: string }[] = [
    { label: "Logo slots filled", arLabel: "خانات الشعار المكتملة", value: `${logoFilled}/3` },
    { label: "Colors defined", arLabel: "الألوان المحددة", value: String(ws.colors.length) },
    {
      label: "Custom fonts applied",
      arLabel: "الخطوط المخصصة المطبّقة",
      value: [ws.typography.latinFontAssetId, ws.typography.arabicFontAssetId].filter(Boolean).length + "/2",
    },
    { label: "Strategy fields filled", arLabel: "حقول الاستراتيجية المكتملة", value: `${strategyFieldsFilled}/8` },
    { label: "Company departments", arLabel: "أقسام الشركة", value: String(ws.departmentViews.length) },
    { label: "Brand files uploaded", arLabel: "ملفات الهوية المرفوعة", value: String(ws.assets.length) },
  ];

  return (
    <div className="mk-surface rounded-2xl p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[14px]">{isAr ? "رؤى العلامة" : "Brand insights"}</span>
        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {isAr ? "محدَّث" : "Updated"} {formatRelative(ws.updatedAt)}
        </span>
      </div>
      {/*
       * One column, not two.
       *
       * In two columns each cell pushed its value to its own right edge, which
       * put "2/3" immediately to the left of "Colors defined" — closer to the
       * next label than to its own. Proximity decides what belongs to what, and
       * it was answering wrong: the card read as six numbers you had to trace
       * back to their labels. Six rows down one column is unambiguous, and it
       * also lines the numbers up, which is the other half of a stat list's
       * job.
       */}
      <div className="flex flex-col gap-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-[12.5px]">
            <span style={{ color: "var(--text-muted)" }}>{isAr ? r.arLabel : r.label}</span>
            <span
              className="font-semibold"
              style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text)" }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
