"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { useDialog } from "../overlay/dialog";
import { useUiStrings } from "../ui-strings";

type LeaveGuardOptions = { title?: string; body?: string; leaveLabel?: string; stayLabel?: string };

/**
 * While `when` is true, leaving asks first. Closing or reloading the tab gets
 * the browser's own prompt (its words can't be changed); a link inside the
 * app gets the kit's confirm dialog, "Leave without saving?", and goes on
 * only on Leave. Returns `confirmLeave()` for leaving in code (a Cancel that
 * navigates away). The browser Back button isn't intercepted: Next's router
 * doesn't offer a way to cancel it.
 */
function useLeaveGuard(when: boolean, options: LeaveGuardOptions = {}) {
  const { t } = useUiStrings();
  const { confirm } = useDialog();
  const router = useRouter();
  const live = useRef({ when, options });
  useEffect(() => {
    live.current = { when, options };
  });

  const confirmLeave = useCallback(async () => {
    if (!live.current.when) return true;
    const o = live.current.options;
    return confirm({
      title: o.title ?? t.form.leaveTitle,
      body: o.body ?? t.form.leaveBody,
      confirmLabel: o.leaveLabel ?? t.form.leave,
      cancelLabel: o.stayLabel ?? t.form.stay,
      tone: "danger",
    });
  }, [confirm, t]);

  useEffect(() => {
    if (!when) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older browsers need a value to show their prompt.
      e.returnValue = "";
    };
    // Capture phase on the document: before Next's Link handler on the root.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      e.preventDefault();
      e.stopPropagation();
      void confirmLeave().then((leave) => leave && router.push(url.pathname + url.search + url.hash));
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [when, confirmLeave, router]);

  return { confirmLeave };
}

/** useLeaveGuard for the Form it sits in: guards while the form has unsaved changes. */
const LeaveGuard = (options: LeaveGuardOptions) => {
  const { formState } = useFormContext();
  useLeaveGuard(formState.isDirty && !formState.isSubmitSuccessful, options);
  return null;
};

export { LeaveGuard, useLeaveGuard };
export type { LeaveGuardOptions };
