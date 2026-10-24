"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/primitives/Icon";
import { useDialog } from "@/components/ui/overlays/Dialog";

/**
 * A small rich-text editor for brand copy — headings, emphasis, lists, quotes,
 * links and tables.
 *
 * Strategy used to store plain strings, which is fine for a one-line purpose
 * and wrong for everything else: a competitive analysis is a table, a set of
 * principles is a list, and a positioning statement often needs a term
 * emphasised. Those are structural, so they are stored as structure.
 *
 * Built on `document.execCommand`. It is formally deprecated and still the
 * only editing API every browser implements the same way; the alternative is
 * a 100KB editor framework for six buttons. The tradeoff is written here
 * rather than discovered later.
 */

/** Detects whether a stored value is already an HTML fragment. */
function isHtml(value: string): boolean {
  return /<(p|h[1-6]|ul|ol|li|table|blockquote|div|br|strong|em|a)\b/i.test(value);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Normalises a stored value to renderable HTML.
 *
 * Values written before this field became rich text — and everything the file
 * importer produces — are plain text. They are escaped and split on blank
 * lines into paragraphs, so old data keeps rendering correctly with no
 * migration step and no risk of a half-converted field.
 */
const toRichHtml = (value: string): string => {
  if (!value.trim()) return "";
  if (isHtml(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

/** Plain text of a rich value — for word counts, linting and "is it empty?". */
const richToPlainText = (value: string): string => {
  if (!value) return "";
  if (!isHtml(value)) return value;
  if (typeof document === "undefined") return value.replace(/<[^>]+>/g, " ");
  const el = document.createElement("div");
  el.innerHTML = value;
  return el.textContent || "";
};

const richIsEmpty = (value: string): boolean => {
  return richToPlainText(value).trim().length === 0;
};

type ToolAction =
  | "heading"
  | "bold"
  | "italic"
  | "bullets"
  | "numbers"
  | "quote"
  | "link"
  | "table"
  | "row"
  | "clear";

/**
 * Declared once at module scope rather than rebuilt per render. Building the
 * list inside the component meant every entry closed over the editor ref
 * during render, which is both a lint error and the thing the rule exists to
 * prevent — the dispatcher below reads the ref only when a button is pressed.
 */
const TOOLS: { action: ToolAction; icon: string; en: string; ar: string }[] = [
  { action: "heading", icon: "heading", en: "Heading", ar: "عنوان" },
  { action: "bold", icon: "bold", en: "Bold", ar: "عريض" },
  { action: "italic", icon: "italic", en: "Italic", ar: "مائل" },
  { action: "bullets", icon: "list-ul", en: "Bulleted list", ar: "قائمة نقطية" },
  { action: "numbers", icon: "list-ol", en: "Numbered list", ar: "قائمة مرقمة" },
  { action: "quote", icon: "quote-right", en: "Quote", ar: "اقتباس" },
  { action: "link", icon: "link", en: "Link", ar: "رابط" },
  { action: "table", icon: "table", en: "Insert table", ar: "إدراج جدول" },
  { action: "row", icon: "plus", en: "Add row to table", ar: "أضف صفًا للجدول" },
  { action: "clear", icon: "undo", en: "Clear formatting", ar: "إزالة التنسيق" },
];

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  isAr?: boolean;
  minHeight?: number;
  autoFocus?: boolean;
};

const RichTextEditor = ({
  value,
  onChange,
  onBlur,
  placeholder,
  isAr = false,
  minHeight = 140,
  autoFocus = false,
}: RichTextEditorProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [empty, setEmpty] = useState(() => richIsEmpty(value));
  const { prompt } = useDialog();

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEmpty(!(el.textContent || "").trim());
    onChange(el.innerHTML);
  }, [onChange]);

  /**
   * React must not own this node's children. Re-rendering a contentEditable
   * from state resets the caret to the start on every keystroke, so the
   * initial HTML is written once through a callback ref and React never
   * touches it again.
   */
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el;
      if (!el) return;
      el.innerHTML = toRichHtml(value);
      setEmpty(!(el.textContent || "").trim());
      if (autoFocus) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    },
    // Intentionally not re-running on `value`: see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoFocus]
  );

  const run = useCallback(
    (action: ToolAction) => {
      const el = ref.current;
      if (!el) return;
      el.focus();

      const exec = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        sync();
      };

      /**
       * Asks a question without losing the caret.
       *
       * `execCommand` acts on the live selection, and opening a dialog moves
       * focus out of this contentEditable, which discards it. So the range is
       * cloned before the dialog opens and put back before the command runs —
       * without this, "Link" would wrap nothing, or the wrong thing.
       */
      const askKeepingSelection = async <T,>(ask: () => Promise<T>): Promise<T> => {
        const sel = window.getSelection();
        const saved = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
        const answer = await ask();
        el.focus();
        if (saved) {
          const live = window.getSelection();
          live?.removeAllRanges();
          live?.addRange(saved);
        }
        return answer;
      };

      const insertTable = (c: number, r: number) => {
        const head = `<tr>${Array.from({ length: c }, () => "<th>&nbsp;</th>").join("")}</tr>`;
        const body = Array.from(
          { length: r },
          () => `<tr>${Array.from({ length: c }, () => "<td>&nbsp;</td>").join("")}</tr>`
        ).join("");
        exec("insertHTML", `<table><thead>${head}</thead><tbody>${body}</tbody></table><p><br></p>`);
      };

      switch (action) {
        case "heading":
          return exec("formatBlock", "h3");
        case "bold":
          return exec("bold");
        case "italic":
          return exec("italic");
        case "bullets":
          return exec("insertUnorderedList");
        case "numbers":
          return exec("insertOrderedList");
        case "quote":
          return exec("formatBlock", "blockquote");
        case "clear":
          return exec("removeFormat");
        case "link": {
          void (async () => {
            const url = await askKeepingSelection(() =>
              prompt({
                title: isAr ? "إضافة رابط" : "Add a link",
                label: isAr ? "عنوان الرابط" : "Link URL",
                placeholder: "https://",
                confirmLabel: isAr ? "ربط" : "Link",
                isAr,
              })
            );
            if (url) exec("createLink", url);
          })();
          return;
        }
        case "table": {
          void (async () => {
            const size = await askKeepingSelection(() =>
              prompt({
                title: isAr ? "إدراج جدول" : "Insert a table",
                label: isAr ? "الأعمدة × الصفوف" : "Columns × rows",
                initialValue: "3x3",
                hint: isAr
                  ? "حتى ٨ أعمدة و٢٠ صفًا، بدون صف العنوان."
                  : "Up to 8 columns and 20 rows, not counting the header.",
                confirmLabel: isAr ? "إدراج" : "Insert",
                isAr,
              })
            );
            if (!size) return;
            // One field instead of two prompts in a row: the second native
            // prompt used to arrive after the first had already been answered,
            // with no way back to change it.
            const [rawCols, rawRows] = size.toLowerCase().split(/[x×*,\s]+/);
            const cols = Number(rawCols);
            const rows = Number(rawRows ?? rawCols);
            if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols < 1 || rows < 1) return;
            insertTable(Math.min(cols, 8), Math.min(rows, 20));
          })();
          return;
        }
        case "row": {
          // Walks up from the caret to the table it sits in, so "add row"
          // applies to the table being edited rather than the first on screen.
          let node = window.getSelection()?.anchorNode as HTMLElement | null;
          while (node && node !== el && node.nodeName !== "TABLE") node = node.parentElement;
          if (!node || node.nodeName !== "TABLE") return;
          const table = node as HTMLTableElement;
          const width = table.rows[0]?.cells.length ?? 0;
          if (!width) return;
          const tr = document.createElement("tr");
          tr.innerHTML = Array.from({ length: width }, () => "<td>&nbsp;</td>").join("");
          (table.tBodies[0] ?? table).appendChild(tr);
          return sync();
        }
      }
    },
    [sync, isAr, prompt]
  );

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg bg-surface-2 shadow-edge-editing"
    >
      <div
        className="flex shrink-0 flex-wrap items-center gap-0.5 px-2 py-1.5 text-text-muted shadow-rule-b"
      >
        {TOOLS.map((t) => {
          const label = isAr ? t.ar : t.en;
          return (
            <button
              key={t.action}
              type="button"
              title={label}
              aria-label={label}
              // The editor loses focus (and the selection with it) the moment a
              // toolbar button takes it, so the press must not move focus at all.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(t.action)}
              className="grid size-7 cursor-pointer place-items-center rounded-md hover:text-text"
            >
              <Icon name={t.icon} size={14} />
            </button>
          );
        })}
      </div>

      <div className="relative">
        {empty && placeholder && (
          <span className="pointer-events-none absolute start-3 top-3 text-ui-md text-text-faint">
            {placeholder}
          </span>
        )}
        <div
          ref={attach}
          contentEditable
          suppressContentEditableWarning
          dir="auto"
          onInput={sync}
          onBlur={onBlur}
          className="rich-text bidi-auto px-3 py-3 text-ui-md text-text outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
};

type RichTextProps = {
  value: string;
  className?: string;
  style?: CSSProperties;
};

/** Read-only rendering of a rich value, on either surface. */
const RichText = ({
  value,
  className = "",
  style,
}: RichTextProps) => {
  if (richIsEmpty(value)) return null;
  return (
    <div
      dir="auto"
      className={`rich-text bidi-auto ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: toRichHtml(value) }}
    />
  );
};

export { richIsEmpty, RichText, RichTextEditor, richToPlainText, toRichHtml };
export type { RichTextEditorProps, RichTextProps };
