"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { Icon } from "@/shared/ui";
import { BLOCK_META, COMMON_BLOCK_KINDS } from "@/features/guideline-site/model/blockCatalog";
import { blockClass, blockStyleCss, blockStyleRules, isEmptyStyle, isHiddenStyle } from "@/features/guideline-site/model/blockStyle";
import { BlockKind, BlockStyle } from "@/core/data/types";

/**
 * The drag payload for a new element coming off the Elements palette.
 *
 * A type of its own, not `text/plain`: a file dragged in from the desktop and a
 * paragraph dragged out of another window both arrive as text, and a canvas that
 * treated either as "add a text block here" would be adding blocks nobody asked
 * for. `text/plain` is still set alongside it, because Firefox will not start a
 * drag without one.
 */
export const BLOCK_DRAG_TYPE = "application/x-markyos-block";

/**
 * The editing layer for the guideline site.
 *
 * The studio edits the real template — the same components the client opens at
 * /v/<slug> — rather than a form that approximates it. That works because the
 * affordances live inside the shared renderers (BlockRenderer and friends): a
 * template needs no knowledge of editing, and the client site renders with no
 * provider mounted, so `enabled` is false and every editing branch compiles
 * away to the plain, uneditable markup it already produced.
 */

interface LiveEditValue {
  enabled: boolean;
  selectedId: string | null;
  select: (id: string | null) => void;
  /**
   * The page's sections in render order, addressed the way the flow addresses
   * them: a derived section by its own id, an authored one as "block-<id>".
   * One list for both is what lets a section move past a kind of section it
   * isn't — the thing the old "fixed sections, then blocks" markup made
   * impossible.
   */
  flowIds: string[];
  moveFlow: (flowId: string, direction: -1 | 1) => void;
  draggingFlowId: string | null;
  beginFlowDrag: (flowId: string | null) => void;
  dropFlowOn: (targetId: string) => void;
  /** Deletes an authored section; parks a derived one, which has no block to delete. */
  removeFlow: (flowId: string) => void;
  duplicateFlow: (flowId: string) => void;
  /** Adds a block of `kind` directly below `flowId`. */
  insertAfter: (flowId: string, kind: BlockKind) => void;
  /**
   * The kind being dragged in from the Elements palette, if any.
   *
   * It lives here rather than being read off the drag event because
   * `DataTransfer.getData` is deliberately blocked during `dragover` — a page
   * may not read what is being dragged over it until it is dropped. So the
   * canvas cannot know, from the event alone, whether the thing crossing it is
   * a block worth opening a gap for or a file from the desktop. The palette and
   * the canvas are in one React tree, so the palette can simply say.
   */
  draggingKind: BlockKind | null;
  update: (blockId: string, patch: { title?: string; arTitle?: string; text?: string; arText?: string }) => void;
  move: (blockId: string, direction: -1 | 1) => void;
  remove: (blockId: string) => void;
  /** Drops a new text block into one column of a layout container. */
  addInColumn: (parentId: string, columnIndex: number) => void;
  /**
   * The blocks this one sits among — its own column if it is nested, the page
   * root otherwise. Moving is scoped to these, so a block inside a column
   * reorders within that column instead of swapping with a page section.
   */
  siblingIds: (blockId: string) => string[];
  /** The block currently being dragged, if any. */
  draggingId: string | null;
  beginDrag: (blockId: string | null) => void;
  /** Drops the dragged block at `targetId`'s position, moving it into that
   *  block's column if it came from elsewhere. */
  dropOn: (targetId: string) => void;
  /**
   * Rewrites a section's heading. Takes the section's DOM id, so the same
   * call covers a derived section ("color", "typography", "app-icon" — stored
   * as a per-language override on the workspace) and a custom block's section
   * heading ("block-<id>" — stored as that block's own title). Templates don't
   * need to know which kind they're rendering.
   */
  renameSection: (sectionId: string, next: string) => void;
  /** Rewrites the line of copy under a section's heading. */
  setSectionNote: (sectionId: string, next: string) => void;
}

const DISABLED: LiveEditValue = {
  enabled: false,
  selectedId: null,
  select: () => {},
  flowIds: [],
  moveFlow: () => {},
  draggingFlowId: null,
  beginFlowDrag: () => {},
  dropFlowOn: () => {},
  removeFlow: () => {},
  duplicateFlow: () => {},
  insertAfter: () => {},
  draggingKind: null,
  update: () => {},
  move: () => {},
  remove: () => {},
  addInColumn: () => {},
  siblingIds: () => [],
  draggingId: null,
  beginDrag: () => {},
  dropOn: () => {},
  renameSection: () => {},
  setSectionNote: () => {},
};

const LiveEditContext = createContext<LiveEditValue>(DISABLED);

export function useLiveEdit(): LiveEditValue {
  return useContext(LiveEditContext);
}

export function LiveEditProvider({
  value,
  children,
}: {
  value: Omit<LiveEditValue, "enabled">;
  children: ReactNode;
}) {
  const merged = useMemo<LiveEditValue>(() => ({ ...value, enabled: true }), [value]);
  return <LiveEditContext.Provider value={merged}>{children}</LiveEditContext.Provider>;
}

/**
 * Text that can be rewritten straight on the page.
 *
 * React deliberately does not own the text of the contentEditable node: if it
 * re-rendered the children on every keystroke the caret would jump to the
 * start mid-word. Instead the DOM holds the draft, the value is pushed in only
 * while the field is unfocused, and the edit is committed on blur.
 */
export function EditableText({
  value,
  onCommit,
  placeholder,
  as: Tag = "span",
  className = "",
  style,
  multiline = false,
  render,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder: string;
  as?: "span" | "div" | "h1" | "h2" | "h3" | "p";
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  /**
   * A typographic treatment of the text — Signal colours the headline's first
   * word in the brand accent, for instance.
   *
   * Given as a pair (markup for the page, elements for the editor) so the
   * canvas shows the same treatment the client will get. It is only ever
   * applied to the *committed* value: the markup's text content has to equal
   * `value` exactly, because that is what is read back on blur.
   */
  render?: { html: (value: string) => string; node: (value: string) => ReactNode };
}) {
  const { enabled } = useLiveEdit();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent === value) return;
    if (render) el.innerHTML = render.html(value);
    else el.textContent = value;
  }, [value, enabled, render]);

  if (!enabled) {
    if (!value) return null;
    return (
      <Tag className={className} style={style} dir="auto">
        {render ? render.node(value) : value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.Ref<never>}
      contentEditable
      suppressContentEditableWarning
      dir="auto"
      role="textbox"
      tabIndex={0}
      data-placeholder={placeholder}
      className={`live-editable ${className}`}
      style={{ whiteSpace: multiline ? "pre-wrap" : undefined, ...style }}
      // The click deliberately bubbles: BlockShell above catches it to select
      // the surrounding block (and stops it there), so putting the caret in a
      // heading also reveals that block's toolbar, the way a canvas editor is
      // expected to behave.
      // Only a real change is committed. Blurring after merely clicking into a
      // heading used to write the same text back, which bumped the workspace
      // (so the site read as having unpublished changes nobody made) and, worse,
      // pushed a do-nothing step onto the undo history — so the first Ctrl+Z
      // after clicking away undid nothing visible.
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.textContent ?? "";
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Escape") {
          e.currentTarget.textContent = value;
          e.currentTarget.blur();
          return;
        }
        if (e.key === "Enter" && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}

/**
 * The heading of a section, rewritable straight on the page.
 *
 * The Logo/Color/Typography sections are *derived* — built from the brand data
 * rather than authored — so there is no block whose title a studio could edit.
 * This is what gives them one anyway: the wording is stored as an override
 * against the section id, and clearing it puts the template's own heading back.
 * On the client-facing site no editing provider is mounted, so this renders the
 * same plain heading it always did.
 */
export function SectionHeading({
  sectionId,
  value,
  as = "h2",
  className = "",
  style,
  placeholder = "Section title",
  render,
}: {
  sectionId: string;
  value: string;
  as?: "span" | "h2" | "h3";
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  render?: { html: (value: string) => string; node: (value: string) => ReactNode };
}) {
  const { renameSection } = useLiveEdit();
  return (
    <EditableText
      as={as}
      value={value}
      onCommit={(next) => renameSection(sectionId, next)}
      placeholder={placeholder}
      className={className}
      style={style}
      render={render}
    />
  );
}

/**
 * Supplies the stored note for each section id.
 *
 * Kept as its own context rather than a prop so a template threads it in once
 * at its root instead of at every section — the alternative was the same
 * `note={sectionNote(id)}` repeated forty times across five files, which is
 * exactly the kind of duplication that drifts.
 */
const SectionNoteContext = createContext<(id: string) => string>(() => "");

export function SectionNoteProvider({ lookup, children }: { lookup: (id: string) => string; children: ReactNode }) {
  return <SectionNoteContext.Provider value={lookup}>{children}</SectionNoteContext.Provider>;
}

/**
 * A line of the studio's own copy beneath a section heading.
 *
 * The Logo/Colour/Type sections show brand *data*; this is where a studio
 * says how to use it — "never on a photograph", "pair 60/30/10". Nothing is
 * rendered on the client site until someone writes something, so an unused
 * note leaves the published page exactly as it was.
 */
export function SectionNote({
  sectionId,
  placeholder = "Add guidance for this section",
  className = "",
  style,
}: {
  sectionId: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { enabled, setSectionNote } = useLiveEdit();
  const value = useContext(SectionNoteContext)(sectionId);
  if (!enabled && !value) return null;
  return (
    <EditableText
      as="p"
      multiline
      value={value}
      onCommit={(next) => setSectionNote(sectionId, next)}
      placeholder={placeholder}
      className={className}
      style={style}
    />
  );
}

/**
 * Wraps one *section* of the page — derived or authored, it makes no
 * difference here — so it can be selected, restyled, reordered, duplicated,
 * removed, and have something new inserted after it, all on the page itself.
 *
 * This is the piece that makes the derived sections first-class. They are built
 * from brand data and have no block behind them, so before this the only thing
 * a studio could do to Logo or Colour was tick it off a list in the sidebar;
 * everything else on the page could be moved and styled and they could not.
 * Addressing a section by its flow id rather than by a block puts both kinds
 * under one set of controls.
 *
 * On the client-facing site no provider is mounted, so this collapses to the
 * element's own styling, and a parked section renders nothing at all.
 */
export function FlowShell({
  flowId,
  kind,
  label,
  style,
  accent,
  children,
}: {
  flowId: string;
  kind: "fixed" | "block";
  /** Named in the drag hint, so it's clear what is being moved. */
  label: string;
  /**
   * The section's own design overrides. Passed in rather than read from the
   * editing context: the client-facing site mounts no such context, and a
   * style that only resolves while editing is a style the client never sees.
   */
  style?: BlockStyle;
  /**
   * The brand's accent, so a section given its own background can render the
   * accent as a readable tint of itself rather than the one solved against the
   * page. Passed in for the same reason `style` is: the published site mounts
   * no editing context to read it from.
   */
  accent?: string;
  children: ReactNode;
}) {
  const {
    enabled,
    selectedId,
    select,
    flowIds,
    moveFlow,
    draggingFlowId,
    beginFlowDrag,
    dropFlowOn,
    removeFlow,
    duplicateFlow,
    insertAfter,
    draggingKind,
  } = useLiveEdit();
  const [armed, setArmed] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const hidden = isHiddenStyle(style);

  if (!enabled) {
    if (hidden) return null;
    return <Styled id={flowId} style={style} accent={accent}>{children}</Styled>;
  }

  const index = flowIds.indexOf(flowId);
  const active = selectedId === flowId;
  const isDragging = draggingFlowId === flowId;

  return (
    <div
      className="live-flow"
      /*
       * The section's own id, on the element.
       *
       * Anything that names a section from outside the canvas — the review
       * panel, the layers tree — needs to be able to find it in the DOM, and
       * the section it names is usually the one you can't currently see.
       * Selecting without revealing is the failure this exists to prevent.
       * (Framer does the same with `data-node-id`, for the same reason: one
       * stable id per rendered element, addressable from the host.)
       */
      data-flow-id={flowId}
      data-active={active || undefined}
      data-dragging={isDragging || undefined}
      data-drop={isOver && !isDragging ? "" : undefined}
      data-parked={hidden || undefined}
      draggable={armed}
      onClick={(e) => {
        e.stopPropagation();
        select(flowId);
      }}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", flowId);
        beginFlowDrag(flowId);
      }}
      onDragEnd={() => {
        setArmed(false);
        setIsOver(false);
        beginFlowDrag(null);
      }}
      onDragOver={(e) => {
        // Two different things can be dropped on a section: another section
        // being reordered, and a new element being dragged in from the palette.
        // Both land in the same place — after this one — and neither can be
        // read off the event, which is why `draggingKind` is context state.
        if (!draggingFlowId && !draggingKind) return;
        if (draggingFlowId === flowId) return;
        // preventDefault unconditionally, or the browser never fires `drop`.
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = draggingKind ? "copy" : "move";
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        const dropped = e.dataTransfer.getData(BLOCK_DRAG_TYPE);
        if (dropped) {
          insertAfter(flowId, dropped as BlockKind);
          return;
        }
        dropFlowOn(flowId);
      }}
    >
      {/*
        The grip, on hover as well as on selection.

        It used to appear only inside the toolbar of an already-selected
        section, so reordering was: click the section, wait for a toolbar,
        press and hold a 28px grip, then drag. Three steps before the gesture
        starts, and nothing anywhere said the gesture existed. A section is a
        thing you move; the handle for moving it should be visible when you
        point at it, which is the whole of the affordance.
      */}
      {!active && (
        <span
          role="button"
          aria-label={`Drag ${label} to reorder`}
          title={`Drag to reorder — ${label}`}
          onMouseDown={() => setArmed(true)}
          onMouseUp={() => setArmed(false)}
          onClick={(e) => e.stopPropagation()}
          className="live-flow-grip"
        >
          <Icon name="grip-vertical" size={13} />
        </span>
      )}
      {active && (
        <div className="live-flow-toolbar" onClick={(e) => e.stopPropagation()}>
          <span
            role="button"
            aria-label={`Drag ${label} to reorder`}
            title={`Drag to reorder — ${label}`}
            onMouseDown={() => setArmed(true)}
            onMouseUp={() => setArmed(false)}
            className="h-7 w-7 grid place-items-center rounded-full"
            style={{ cursor: "grab", color: "#fff" }}
          >
            <Icon name="grip-vertical" size={13} />
          </span>
          <ToolbarButton icon="angle-up" label="Move up" disabled={index <= 0} onClick={() => moveFlow(flowId, -1)} />
          <ToolbarButton
            icon="angle-down"
            label="Move down"
            disabled={index < 0 || index >= flowIds.length - 1}
            onClick={() => moveFlow(flowId, 1)}
          />
          {kind === "block" && <ToolbarButton icon="copy" label="Duplicate" onClick={() => duplicateFlow(flowId)} />}
          <ToolbarButton
            // A derived section has no block to throw away — its content is the
            // brand's own colours or type — so it is parked, not deleted, and
            // the control says so rather than pretending to destroy something.
            icon={kind === "fixed" ? (hidden ? "check" : "times") : "times"}
            label={kind === "fixed" ? (hidden ? "Put back on the site" : "Take off the site") : "Delete"}
            onClick={() => removeFlow(flowId)}
            danger={kind === "block" || !hidden}
          />
        </div>
      )}
      {hidden && (
        <div className="live-flow-parked" onClick={(e) => e.stopPropagation()}>
          <Icon name="eye-slash" size={11} />
          Off the published site
        </div>
      )}
      <Styled id={flowId} style={style} accent={accent}>{children}</Styled>
    </div>
  );
}

/**
 * A section's own design, applied.
 *
 * Two halves, because CSS gives no choice. The base values are an inline style
 * — one element, no cascade to reason about. Anything scoped to a narrower
 * width or the other direction cannot be expressed inline at all, so it becomes
 * a real rule in a `<style>` tag beside the element, keyed to a class derived
 * from the section's id.
 *
 * Both halves render on the published site as well as on the canvas. A
 * responsive override that only worked while editing would be worse than not
 * having one: the studio would see a phone layout the client never gets.
 */
function Styled({
  id,
  style,
  accent,
  children,
}: {
  id: string;
  style?: BlockStyle;
  accent?: string;
  children: ReactNode;
}) {
  if (isEmptyStyle(style)) return <>{children}</>;
  const rules = blockStyleRules(id, style);
  return (
    <div className={rules ? blockClass(id) : undefined} style={blockStyleCss(style, accent)}>
      {rules && <style>{rules}</style>}
      {children}
    </div>
  );
}

/**
 * The gap between two sections, as a place to put something.
 *
 * Adding always meant appending to the bottom and dragging the result up past
 * everything else. Here the insertion point is the gap the studio clicked, so
 * "put a quote between the logo and the palette" is one action.
 */
export function InsertPoint({
  afterId,
  isAr,
  after,
}: {
  afterId: string;
  isAr: boolean;
  /**
   * The name of the section this gap follows.
   *
   * A page has one of these between every pair of sections, and they were all
   * called "Add an element here" — fourteen identical buttons whose only
   * distinguishing feature was a position that a screen reader cannot see and
   * a tooltip cannot say. Naming each one after the section above it is the
   * difference between a list of choices and a list of the same choice.
   */
  after?: string;
}) {
  const { enabled, insertAfter, draggingKind } = useLiveEdit();
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);

  if (!enabled) return null;

  /*
   * While an element is being dragged in, every gap opens.
   *
   * A 14px strip that only expands on `:hover` is not a drop target anyone can
   * find mid-drag — the pointer is carrying something, the strip is invisible,
   * and hovering a zero-opacity 14px band to reveal the thing you were trying
   * to aim at is a circular instruction. So the gaps announce themselves for as
   * long as there is something to put in them.
   */
  return (
    <div
      className="live-insert"
      data-open={open || undefined}
      data-armed={draggingKind ? "" : undefined}
      data-over={over ? "" : undefined}
      onClick={(e) => e.stopPropagation()}
      onDragOver={(e) => {
        if (!draggingKind) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setOver(false);
      }}
      onDrop={(e) => {
        const dropped = e.dataTransfer.getData(BLOCK_DRAG_TYPE);
        if (!dropped) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        insertAfter(afterId, dropped as BlockKind);
      }}
    >
      {draggingKind ? (
        <span className="live-insert-landing">
          <Icon name={BLOCK_META[draggingKind].icon} size={11} />
          {isAr ? `ضع ${BLOCK_META[draggingKind].arLabel} هنا` : `Drop ${BLOCK_META[draggingKind].label} here`}
        </span>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={
            after
              ? isAr
                ? `أضف عنصرًا بعد ${after}`
                : `Add an element after ${after}`
              : isAr
                ? "أضف عنصرًا هنا"
                : "Add an element here"
          }
          title={after ? (isAr ? `أضف بعد ${after}` : `Add after ${after}`) : undefined}
          className="live-insert-trigger"
        >
          <Icon name="plus" size={11} />
          {isAr ? "أضف هنا" : "Add here"}
        </button>
      ) : (
        <div className="live-insert-menu">
          {COMMON_BLOCK_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                insertAfter(afterId, kind);
                setOpen(false);
              }}
              className="live-insert-item"
            >
              <Icon name={BLOCK_META[kind].icon} size={13} />
              {isAr ? BLOCK_META[kind].arLabel : BLOCK_META[kind].label}
            </button>
          ))}
          <button type="button" onClick={() => setOpen(false)} className="live-insert-item" style={{ opacity: 0.7 }}>
            <Icon name="times" size={12} />
            {isAr ? "إلغاء" : "Cancel"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Wraps one block on the canvas so it can be selected and reordered without
 * leaving the page. Renders nothing extra when editing is off.
 */
export function BlockShell({
  blockId,
  style,
  accent,
  children,
}: {
  blockId: string;
  /** The block's own design overrides — passed in for the same reason as FlowShell's. */
  style?: BlockStyle;
  /** The brand's accent — see FlowShell. */
  accent?: string;
  children: ReactNode;
}) {
  const { enabled, selectedId, select, move, remove, siblingIds, draggingId, beginDrag, dropOn, flowIds, duplicateFlow } =
    useLiveEdit();
  // `draggable` is armed only while the grip is held: a permanently draggable
  // block would swallow text selection inside its own editable fields.
  const [armed, setArmed] = useState(false);
  const [isOver, setIsOver] = useState(false);

  // Selection is addressed in flow ids throughout, so a nested block and a
  // whole section are the same kind of thing to everything that reads it —
  // the inspector, the keyboard shortcuts, the toolbar.
  const flowId = `block-${blockId}`;

  const onSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      select(flowId);
    },
    [flowId, select]
  );

  const styled = <Styled id={flowId} style={style} accent={accent}>{children}</Styled>;

  /**
   * A block sitting at the page root is already a section of the flow, and
   * FlowShell is wrapping this very call. Drawing a second toolbar and a
   * second drop target around the same content would give it two of
   * everything, so the root case defers and this shell handles only the
   * blocks nested inside a layout container — which the flow doesn't reach.
   */
  const handledByFlow = flowIds.includes(flowId);

  if (!enabled || handledByFlow) {
    if (!enabled && isHiddenStyle(style)) return null;
    return styled;
  }

  const active = selectedId === flowId;
  const siblings = siblingIds(blockId);
  const index = siblings.indexOf(blockId);
  const isDragging = draggingId === blockId;

  return (
    <div
      className="live-block"
      /* The same hook as FlowShell's — a nested block is addressed by the same
         flow id everywhere else, so it must be findable by it too. */
      data-flow-id={flowId}
      data-active={active || undefined}
      data-dragging={isDragging || undefined}
      data-drop={isOver && !isDragging ? "" : undefined}
      draggable={armed}
      onClick={onSelect}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", blockId);
        beginDrag(blockId);
      }}
      onDragEnd={() => {
        setArmed(false);
        setIsOver(false);
        beginDrag(null);
      }}
      onDragOver={(e) => {
        if (draggingId === blockId) return;
        // preventDefault unconditionally — without it the browser never fires
        // `drop`. Whether anything actually moves is decided in dropOn, which
        // checks that a block drag is genuinely in flight.
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        if (draggingId && !isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        dropOn(blockId);
      }}
    >
      {active && (
        <div className="live-block-toolbar" onClick={(e) => e.stopPropagation()}>
          <span
            role="button"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            onMouseDown={() => setArmed(true)}
            onMouseUp={() => setArmed(false)}
            className="h-7 w-7 grid place-items-center rounded-full"
            style={{ cursor: "grab", color: "#fff" }}
          >
            <Icon name="grip-vertical" size={13} />
          </span>
          <ToolbarButton
            icon="angle-up"
            label="Move up"
            disabled={index <= 0}
            onClick={() => move(blockId, -1)}
          />
          <ToolbarButton
            icon="angle-down"
            label="Move down"
            disabled={index < 0 || index >= siblings.length - 1}
            onClick={() => move(blockId, 1)}
          />
          <ToolbarButton icon="copy" label="Duplicate" onClick={() => duplicateFlow(flowId)} />
          <ToolbarButton icon="times" label="Delete" onClick={() => remove(blockId)} danger />
        </div>
      )}
      {styled}
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 grid place-items-center rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={{ color: danger ? "var(--danger)" : "#fff" }}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}
