"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast, useDialog, Icon, AutoTextarea, Popover } from "@/components/ui";
import { TopBar, TopBarTab } from "@/components/layout";
import { EmptyHint, Switch } from "@/components/ui/composites/SectionUI";
import { DepartmentDocument } from "@/components/features/guideline-site";
import { ShareLinksPanel } from "@/components/features/sharing";
import { InstructionEditor, ImportInstructionsModal } from "@/components/features/departments";
import { DeptItemType, SectionKey, Workspace } from "@/types";
import { fileToDataUrl, formatBytes } from "@/lib/utils";

const SECTION_META: Record<SectionKey, { label: string; icon: string; href: string }> = {
  overview: { label: "Overview", icon: "file-alt", href: "overview" },
  logo: { label: "Logo system", icon: "shapes", href: "visual-identity" },
  color: { label: "Color", icon: "palette", href: "visual-identity" },
  typography: { label: "Typography", icon: "font", href: "visual-identity" },
};

export default function DepartmentsPage() {
  const params = useParams<{ slug: string }>();
  const { getWorkspace, addDepartmentView, uiLang } = useApp();
  const { prompt } = useDialog();
  const ws = getWorkspace(params.slug);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "read">("edit");

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  const sorted = [...ws.departmentViews].sort((a, b) => a.createdAt - b.createdAt);
  const active = activeId ? sorted.find((d) => d.id === activeId) : sorted[0];

  async function handleAdd() {
    const name = await prompt({
      title: isAr ? "قسم جديد" : "New department",
      label: isAr ? "اسم القسم" : "Department name",
      placeholder: isAr ? "المبيعات" : "Sales",
      hint: isAr
        ? "القسم يحصل على صفحة إرشادات خاصة به."
        : "Each department gets its own guideline page.",
      confirmLabel: isAr ? "إنشاء" : "Create",
      isAr,
    });
    if (!name) return;
    const id = addDepartmentView(ws!.id, name);
    setActiveId(id);
  }

  const tabs: TopBarTab[] = sorted.map((d) => ({
    key: d.id,
    label: d.name,
    arLabel: d.name,
    active: active?.id === d.id,
    onSelect: () => setActiveId(d.id),
  }));

  return (
    <>
      <TopBar
        workspace={ws}
        section="Company departments"
        arSection="أقسام الشركة"
        tabs={tabs}
        tabsRight={
          <button
            type="button"
            onClick={() => void handleAdd()}
            aria-label="Add department"
            className="h-8 w-8 rounded-full grid place-items-center cursor-pointer"
            style={{ background: "var(--surface-2)" }}
          >
            <Icon name="plus" size={13} />
          </button>
        }
        right={
          active ? (
            <div className="flex items-center gap-2">
              {/* Same move as Strategy: sharing a department is reachable from
                  the department, not only from its Read view. */}
              <Popover
                label={isAr ? "مشاركة هذا القسم" : "Share this department"}
                width={430}
                buttonStyle={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 500,
                  gap: 6,
                  whiteSpace: "nowrap",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                }}
                button={
                  <>
                    <Icon name="link" size={13} />
                    {isAr ? "مشاركة" : "Share"}
                  </>
                }
              >
                {() => (
                  <div className="p-1">
                    <ShareLinksPanel ws={ws} scope="department" departmentId={active.id} isAr={isAr} />
                  </div>
                )}
              </Popover>
              <div className="inline-flex rounded-full p-[3px]" style={{ background: "var(--surface-1)" }}>
              {(["edit", "read"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="h-7 px-3 rounded-full text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
                  style={{
                    background: mode === m ? "var(--solid)" : "transparent",
                    color: mode === m ? "var(--solid-ink)" : "var(--text-muted)",
                  }}
                >
                  <Icon name={m === "edit" ? "pen" : "book"} size={11} />
                  {m === "edit" ? (isAr ? "تحرير" : "Edit") : isAr ? "قراءة" : "Read"}
                </button>
              ))}
              </div>
            </div>
          ) : undefined
        }
      />
      <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto max-w-[820px]">
        {sorted.length === 0 || !active ? (
          <>
            <div>
              <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
                {isAr ? "أقسام الشركة" : "Company departments"}
              </h1>
              <p className="text-[14px] max-w-[62ch]" style={{ color: "var(--text-muted)" }}>
                A department&apos;s own onboarding page — its guideline content, plus a filtered view into the
                sections and strategy content that actually apply to it.
              </p>
            </div>
            <EmptyHint>
              No departments yet. Department names are free text — HR, Sales, Partnerships, Executives,
              whatever your org actually calls them.
            </EmptyHint>
            <button
              type="button"
              onClick={() => void handleAdd()}
              className="h-10 px-4 rounded-lg text-[12px] font-semibold cursor-pointer self-start"
              style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
            >
              Add department
            </button>
          </>
        ) : mode === "read" ? (
          <article className="flex flex-col gap-7">
            <header className="flex flex-col gap-1.5">
              <span
                className="text-[11px] font-semibold uppercase"
                style={{ letterSpacing: ".12em", color: "var(--text-faint)" }}
              >
                {isAr ? `${ws.name} · تعليمات القسم` : `${ws.name} · department instructions`}
              </span>
              <h1
                dir="auto"
                className="bidi-auto text-[34px] font-semibold tracking-tight leading-[1.15]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {active.name}
              </h1>
            </header>
            <DepartmentDocument ws={ws} view={active} isAr={isAr} />

            {/* The share panel moved to the top bar, where it is reachable
                while editing the department too. */}
          </article>
        ) : (
          <DepartmentPanel key={active.id} ws={ws} viewId={active.id} />
        )}
      </div>
    </>
  );
}

function DepartmentPanel({ ws, viewId }: { ws: Workspace; viewId: string }) {
  const {
    renameDepartmentView,
    removeDepartmentView,
    setDeptGuideline,
    setDeptPublish,
    addAsset,
    addDeptItem,
    removeDeptItem,
    uiLang,
  } = useApp();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();
  const view = ws.departmentViews.find((d) => d.id === viewId);
  const [textDraft, setTextDraft] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [pickedType, setPickedType] = useState<DeptItemType>("section");
  const [pickedSection, setPickedSection] = useState<SectionKey>("overview");
  const [pickedRef, setPickedRef] = useState("");
  const [note, setNote] = useState("");

  if (!view) return null;
  const isAr = uiLang(ws) === "ar";
  const guidelineFile = view.guidelineFileAssetId ? ws.assets.find((a) => a.id === view.guidelineFileAssetId) : undefined;

  async function handleRename() {
    const name = await prompt({
      title: isAr ? "إعادة تسمية القسم" : "Rename department",
      label: isAr ? "اسم القسم" : "Department name",
      initialValue: view!.name,
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (name) renameDepartmentView(ws.id, view!.id, name);
  }

  /**
   * Deleting a department took the guideline text and the curated list with
   * it, on a single unguarded click of a small icon next to the rename pencil.
   * Nothing in the product restores it.
   */
  async function handleDelete() {
    const ok = await confirm({
      title: isAr ? `حذف ${view!.name}؟` : `Delete ${view!.name}?`,
      body: isAr
        ? "تُحذف إرشادات هذا القسم والعناصر المرتبطة به. لا يمكن التراجع."
        : "Its guideline text, uploaded file and curated list go with it. This can't be undone.",
      confirmLabel: isAr ? "حذف" : "Delete",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    removeDepartmentView(ws.id, view!.id);
    showToast("Department removed.");
  }

  async function handleUploadGuideline(file: File) {
    const url = await fileToDataUrl(file);
    addAsset(ws.id, { type: "pdf", fileName: file.name, url, sizeKB: file.size / 1024, tags: [`dept-${view!.id}`] });
    // The asset was just prepended, so it's the freshest one tagged for this department.
    const freshest = [...ws.assets].sort((a, b) => b.uploadedAt - a.uploadedAt)[0];
    setDeptGuideline(ws.id, view!.id, { guidelineFileAssetId: freshest?.id });
    showToast("Guideline file uploaded.", "success");
  }

  function submitItem() {
    if (pickedType === "persona" || pickedType === "voiceTrait") {
      if (!pickedRef) return;
    }
    addDeptItem(ws.id, view!.id, {
      itemType: pickedType,
      sectionKey: pickedType === "section" ? pickedSection : undefined,
      refId: pickedType === "persona" || pickedType === "voiceTrait" ? pickedRef : undefined,
      relevanceNote: note.trim() || undefined,
    });
    setNote("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          {view.name}
        </h1>
        {/*
         * The delete used to be a `times` glyph sitting 12px from the rename
         * pencil in the same grey. Two problems, both of them the same one:
         * `times` means "close this" everywhere else in the app, so the icon
         * did not say what it did; and the most destructive control on the page
         * was the visual twin of the most harmless one right beside it. Now it
         * is a bin, it is named, it is separated by a rule, and it turns the
         * warning colour under the pointer — you can see what it is before you
         * commit to it, which is the half of error prevention that happens
         * before the confirm dialog.
         */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleRename()}
            aria-label={isAr ? `أعد تسمية ${view.name}` : `Rename ${view.name}`}
            title={isAr ? "إعادة التسمية" : "Rename"}
            className="mk-icon-btn cursor-pointer"
          >
            <Icon name="pen" size={14} style={{ color: "var(--text-faint)" }} />
          </button>
          <span aria-hidden className="w-px h-4 mx-1" style={{ background: "var(--hairline-strong)" }} />
          <button
            type="button"
            onClick={() => void handleDelete()}
            aria-label={isAr ? `احذف قسم ${view.name}` : `Delete the ${view.name} department`}
            title={isAr ? "حذف القسم" : "Delete department"}
            className="mk-icon-btn mk-danger-hover cursor-pointer"
          >
            <Icon name="trash" size={14} style={{ color: "var(--text-faint)" }} />
          </button>
        </div>
      </div>

      {/* Whether this page reaches the client-facing site. A department page is
          often internal, so publishing is a decision rather than a default
          consequence of writing one. */}
      <div className="mk-surface rounded-2xl px-5 py-4 flex items-center gap-4" style={{ background: "var(--surface-1)" }}>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium">
            {isAr ? "انشر في موقع الدليل" : "Publish to the guideline site"}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "var(--text-faint)" }}>
            {view.publishToSite
              ? isAr
                ? "يظهر هذا القسم للعميل ضمن قسم «الأقسام»."
                : "This page appears to the client under the Departments section."
              : isAr
                ? "داخلي فقط — لا يظهر للعميل."
                : "Internal only — the client never sees it."}
          </div>
        </div>
        <Switch
          label={isAr ? "انشر في موقع الدليل" : "Publish to the guideline site"}
          checked={view.publishToSite}
          onToggle={() => setDeptPublish(ws.id, view!.id, !view!.publishToSite)}
        />
      </div>

      <InstructionEditor ws={ws} view={view} onImport={() => setImportOpen(true)} />
      {importOpen && <ImportInstructionsModal ws={ws} view={view} onClose={() => setImportOpen(false)} />}

      <div className="mk-surface rounded-2xl p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[15px]">{isAr ? "محتوى الدليل" : "Guideline content"}</span>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadGuideline(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mk-tap text-[12px] font-semibold cursor-pointer"
            style={{ color: "var(--accent-text)" }}
          >
            Upload guideline file
          </button>
        </div>
        {guidelineFile && (
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)" }}>
            <Icon name="file-alt" size={14} style={{ color: "var(--text-faint)" }} />
            <span className="text-[12px] flex-1 truncate">{guidelineFile.fileName}</span>
            <span className="text-[11px]" style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}>
              {formatBytes(guidelineFile.sizeKB)}
            </span>
            <button
              type="button"
              onClick={() => setDeptGuideline(ws.id, view!.id, { guidelineFileAssetId: undefined })}
              aria-label="Remove file"
              className="cursor-pointer"
            >
              <Icon name="times" size={12} style={{ color: "var(--text-faint)" }} />
            </button>
          </div>
        )}
        <AutoTextarea
          minRows={4}
          caretAtEnd={false}
          value={textDraft ?? view.guidelineText}
          onChange={setTextDraft}
          onBlur={() => {
            if (textDraft !== null) setDeptGuideline(ws.id, view!.id, { guidelineText: textDraft.trim() });
            setTextDraft(null);
          }}
          aria-label={
            isAr ? `دليل قسم ${view.name}` : `Guideline text for ${view.name}`
          }
          placeholder={isAr ? "أو اكتب دليل هذا القسم كنص هنا…" : "…or write this department's guidelines as text here."}
          className="rounded-lg p-3 outline-none text-[14px] leading-[1.7]"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        />
      </div>

      <div className="mk-surface rounded-2xl p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[15px]">{isAr ? "روابط ذات صلة" : "Relevant links"}</span>
          <button type="button" onClick={() => setAdding((v) => !v)} className="mk-tap text-[12px] font-semibold cursor-pointer" style={{ color: "var(--accent-text)" }}>
            {adding ? "Cancel" : "+ Add"}
          </button>
        </div>
        <p className="text-[12px] -mt-2" style={{ color: "var(--text-faint)" }}>
          Nothing here is a copy — every item is pulled live, so editing Strategy or a section updates this automatically.
        </p>

        {adding && (
          <div className="mk-surface rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "var(--surface-2)" }}>
            <div className="flex gap-1.5 flex-wrap">
              {(["section", "purpose", "mission", "persona", "voiceTrait"] as DeptItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setPickedType(t);
                    setPickedRef("");
                  }}
                  className="h-8 px-3 rounded-full text-[11px] font-semibold cursor-pointer"
                  style={{ background: pickedType === t ? "var(--solid)" : "var(--surface-1)", color: pickedType === t ? "var(--solid-ink)" : "var(--text-muted)" }}
                >
                  {t === "voiceTrait" ? "Voice trait" : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {pickedType === "section" && (
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(SECTION_META) as SectionKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPickedSection(key)}
                    className="h-8 px-3 rounded-full text-[11px] font-semibold cursor-pointer"
                    style={{ background: pickedSection === key ? "var(--accent-soft)" : "var(--surface-1)", color: pickedSection === key ? "var(--accent-on-soft)" : "var(--text-muted)" }}
                  >
                    {SECTION_META[key].label}
                  </button>
                ))}
              </div>
            )}

            {pickedType === "persona" && (
              <div className="flex gap-1.5 flex-wrap">
                {ws.strategy.personas.length === 0 ? (
                  <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>No personas yet — add some in Strategy first.</span>
                ) : (
                  ws.strategy.personas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPickedRef(p.id)}
                      className="h-8 px-3 rounded-full text-[11px] font-semibold cursor-pointer"
                      style={{ background: pickedRef === p.id ? "var(--accent-soft)" : "var(--surface-1)", color: pickedRef === p.id ? "var(--accent-on-soft)" : "var(--text-muted)" }}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            )}

            {pickedType === "voiceTrait" && (
              <div className="flex gap-1.5 flex-wrap">
                {ws.strategy.voiceTraits.length === 0 ? (
                  <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>No voice traits yet — add some in Strategy first.</span>
                ) : (
                  ws.strategy.voiceTraits.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPickedRef(t.id)}
                      className="h-8 px-3 rounded-full text-[11px] font-semibold cursor-pointer"
                      style={{ background: pickedRef === t.id ? "var(--accent-soft)" : "var(--surface-1)", color: pickedRef === t.id ? "var(--accent-on-soft)" : "var(--text-muted)" }}
                    >
                      {t.trait}
                    </button>
                  ))
                )}
              </div>
            )}

            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this matters for this department (optional)"
              className="h-9 px-3 rounded-lg outline-none text-[12px]"
              style={{ background: "var(--surface-1)", color: "var(--text)" }}
            />
            <button
              type="button"
              onClick={submitItem}
              className="h-9 rounded-lg text-[12px] font-semibold cursor-pointer self-start px-4"
              style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
            >
              Add to {view.name}
            </button>
          </div>
        )}

        {view.items.length === 0 ? (
          <EmptyHint>Nothing selected yet.</EmptyHint>
        ) : (
          <div className="flex flex-col gap-2">
            {view.items.map((item) => (
              <ResolvedItem key={item.id} ws={ws} item={item} onRemove={() => removeDeptItem(ws.id, view!.id, item.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResolvedItem({
  ws,
  item,
  onRemove,
}: {
  ws: Workspace;
  item: Workspace["departmentViews"][number]["items"][number];
  onRemove: () => void;
}) {
  let icon = "file-alt";
  let title = "";
  let body = "";

  if (item.itemType === "section" && item.sectionKey) {
    icon = SECTION_META[item.sectionKey].icon;
    title = SECTION_META[item.sectionKey].label;
    body = "Guideline section";
  } else if (item.itemType === "purpose") {
    icon = "bullseye";
    title = "Purpose";
    body = ws.strategy.purpose || "Not written yet.";
  } else if (item.itemType === "mission") {
    icon = "bullseye";
    title = "Mission";
    body = ws.strategy.mission || "Not written yet.";
  } else if (item.itemType === "persona") {
    const p = ws.strategy.personas.find((x) => x.id === item.refId);
    icon = "users";
    title = p ? p.name : "Persona (removed)";
    body = p ? `${p.role} — ${p.description}` : "This persona no longer exists in Strategy.";
  } else if (item.itemType === "voiceTrait") {
    const t = ws.strategy.voiceTraits.find((x) => x.id === item.refId);
    icon = "quote-right";
    title = t ? t.trait : "Voice trait (removed)";
    body = t ? t.doExample : "This voice trait no longer exists in Strategy.";
  }

  return (
    <div className="mk-surface rounded-xl p-3.5 flex items-start gap-3" style={{ background: "var(--surface-2)" }}>
      <Icon name={icon} size={15} style={{ color: "var(--accent-text)", marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{body}</div>
        {item.relevanceNote && (
          <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>Why: {item.relevanceNote}</div>
        )}
      </div>
      <button type="button" onClick={onRemove} aria-label={`Remove ${title}`} title={`Remove ${title}`} className="mk-icon-btn mk-danger-hover cursor-pointer shrink-0">
        <Icon name="times" size={13} style={{ color: "var(--text-faint)" }} />
      </button>
    </div>
  );
}
