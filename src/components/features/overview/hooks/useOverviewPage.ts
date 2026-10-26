"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { useDialog, useToast } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { PAGE_SECTION, type ToolbarAction } from "../constants";

const countWords = (el: HTMLElement) => (el.textContent || "").trim().split(/\s+/).filter(Boolean).length;

/** The overview page: the rich-text editor, its toolbar, and the preview-language switch. */
export function useOverviewPage(slug: string) {
  const { setOverview, setPrimaryLocale } = useApp();
  const page = useBrandPage(slug);
  const { showToast } = useToast();
  const { prompt } = useDialog();
  const ws = page?.workspace;
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
      setWordCount(countWords(editorRef.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const savedLabel = useMemo(() => (ws ? `Saved ${formatRelative(ws.overviewSavedAt)}` : ""), [ws]);

  if (!page || !ws) return null;
  const { isAr } = page;

  function handleInput() {
    if (!editorRef.current || !ws) return;
    setWordCount(countWords(editorRef.current));
    setOverview(ws.id, editorRef.current.innerHTML);
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

  // The brand's own language, not the reader's: the toast calls it the
  // preview, and it decides what a client sees at /v/<slug>.
  function toggleLocale() {
    if (!ws) return;
    setPrimaryLocale(ws.id, isAr ? "en" : "ar");
    showToast(isAr ? "Switched preview to English." : "Switched preview to Arabic.");
  }

  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const },
    savedLabel,
    view: {
      ws,
      isAr,
      onToggleLocale: toggleLocale,
      editor: { editorRef, isAr, wordCount, onInput: handleInput, onTool: runTool },
    },
  };
}
