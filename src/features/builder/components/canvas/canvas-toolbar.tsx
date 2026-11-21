import { Button, IconButton, Kbd } from "@/components/ui";
import { BLOCK_META } from "@/features/guideline-site";
import type { BuilderPageState } from "../../hooks/use-builder-page";

/** The bar over the canvas: the page and its address, the shortcut hint, undo and redo, and auto-fill. The view moved to the top bar. */
export function CanvasToolbar(b: BuilderPageState) {
  const { ws, isAr, activePage, selectedId, selected, autoFillCount } = b;
  return (
    <div className="flex h-12 shrink-0 items-center gap-ctl-row px-5 shadow-rule-b">
      {/* A long page name truncates (with its full name on hover) instead of pushing the controls off the end. */}
      <h2 dir="auto" title={activePage ? (isAr ? activePage.arName : activePage.name) : undefined} className="min-w-0 max-w-[40%] shrink truncate text-[13px] font-semibold">{activePage ? (isAr ? activePage.arName : activePage.name) : isAr ? "الرئيسية" : "Home"}</h2>
      {activePage && (
        <>
          <IconButton icon="pen" label={isAr ? "أعد تسمية الصفحة" : "Rename page"} onClick={b.onRenamePage} className="cursor-pointer text-text-faint" />
          <IconButton icon="times" label={isAr ? "احذف الصفحة" : "Delete page"} title={isAr ? "احذف هذه الصفحة" : "Delete this page"} onClick={b.onDeletePage} className="mk-danger-hover cursor-pointer text-text-faint" />
        </>
      )}
      <span dir="ltr" className="min-w-0 truncate text-[11.5px] text-text-faint">{activePage ? `/v/${ws.slug}/p/${activePage.slug}` : `/v/${ws.slug}`}</span>
      {/*
        The hint takes all the slack, outside the control group. It says
        something different depending on the selection, and different widths
        made the view switcher slide sideways on every click. Prose can reflow;
        a control somebody is aiming at may not move.
      */}
      <span className="hidden min-w-0 flex-1 items-center justify-end gap-2 text-[11.5px] text-text-faint xl:flex">
        {selectedId ? (
          <>
            {isAr ? "المحدد:" : "Selected:"}
            <span className="text-text-muted">{selected ? (isAr ? BLOCK_META[selected.kind].arLabel : BLOCK_META[selected.kind].label) : selectedId}</span>
            <Kbd>Esc</Kbd>
            {isAr ? "لإلغاء التحديد" : "to deselect"}
            {selected && (
              <>
                <Kbd>Del</Kbd>
                {isAr ? "للحذف" : "to delete"}
              </>
            )}
          </>
        ) : (
          <>
            {isAr ? "اضغط على أي نص لتحريره مباشرة" : "Click any text to edit it in place"}
            <Kbd>⌘Z</Kbd>
            {isAr ? "للتراجع" : "to undo"}
          </>
        )}
      </span>

      {/* The controls, pinned to the end edge; `ms-auto` carries them there
          below xl, where the hint is not rendered. */}
      <span className="ms-auto flex shrink-0 items-center gap-ctl-row xl:ms-2.5">
        {/* Undo and redo as a pair: a lone undo can walk you back but not
            forward again, which makes trying something out cost more. */}
        <span className="flex items-center gap-ctl-row">
          {/* Kit icon buttons (review item 3): the same size and disabled look as every other control. */}
          <IconButton icon="undo" iconSize={16} size="sm" shape="round" onClick={() => b.undo()} disabled={!b.canUndo} label={isAr ? "تراجع" : "Undo"} title={isAr ? "تراجع (Ctrl+Z)" : "Undo (Ctrl+Z)"} />
          {/* Redo is the undo glyph turned round (the icon set has no redo): the pair stays a mirror image in both directions. */}
          <IconButton icon="undo" iconSize={16} size="sm" shape="round" className="[&_.la-undo]:-scale-x-100" onClick={() => b.redo()} disabled={!b.canRedo} label={isAr ? "إعادة" : "Redo"} title={isAr ? "إعادة (Ctrl+Shift+Z)" : "Redo (Ctrl+Shift+Z)"} />
        </span>
        {!activePage && (
          <Button
            variant="secondary"
            size="sm"
            onClick={b.onAutoFill}
            // The kit's reason tooltip, not a `title`: a disabled button's
            // title never shows, so it just looked broken.
            disabledReason={autoFillCount === 0 ? (isAr ? "أضف نماذج تطبيقية أو ملفات تصدير في الأصول أولًا." : "Add mockups or exports in Assets first.") : undefined}
            title={
              autoFillCount > 0
                ? isAr
                  ? `يضيف أقسامًا جاهزة من الأصول (${autoFillCount} ملف).`
                  : `Adds ready-made sections from your assets (${autoFillCount} file${autoFillCount === 1 ? "" : "s"}).`
                : undefined
            }
            className="shrink-0"
          >
            {isAr ? "تعبئة تلقائية" : "Auto-fill"}
          </Button>
        )}
      </span>
    </div>
  );
}
