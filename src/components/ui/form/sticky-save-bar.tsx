"use client";

import { useFormContext } from "react-hook-form";
import { usePresence } from "@/hooks/usePresence";
import { variants } from "@/lib/motion";
import { Button } from "../button/button";
import { useFormMeta } from "./form-context";

type StickySaveBarProps = {
  /** Default "You have unsaved changes." */
  message?: string;
  saveLabel?: string;
  discardLabel?: string;
};

/**
 * Rises from the bottom of the screen once the form has changes ("You have
 * unsaved changes." · Discard · Save) and goes when it's clean again: after a
 * save, a discard, or undoing the edit by hand. Long settings pages keep
 * their one save action in reach. Its message is a polite live region.
 */
const StickySaveBar = ({ message, saveLabel, discardLabel }: StickySaveBarProps) => {
  const meta = useFormMeta();
  const { formState, reset } = useFormContext();
  const show = formState.isDirty && !meta.view && !meta.locked;
  const { mounted, closing } = usePresence(show);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-sticky flex justify-center px-space-5 pb-space-6">
      {mounted && (
        <div
          className={`pointer-events-auto flex w-full max-w-2xl flex-wrap items-center gap-space-5 rounded-card bg-surface-1 px-space-6 py-space-4 shadow-edge-pop motion-reduce:animate-none ${closing ? variants.slideFromBottom.exit : variants.slideFromBottom.enter}`}
        >
          {/* The message takes its own line on a phone; the two buttons stay together. */}
          <span className="min-w-48 flex-1 text-body font-medium text-text">{message ?? meta.strings.unsaved}</span>
          <div className="ms-auto flex items-center gap-space-3">
            <Button type="button" variant="ghost" size="sm" disabled={meta.submitting} onClick={() => reset()}>
              {discardLabel ?? meta.strings.discard}
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={meta.submitting} loadingText={meta.strings.submitting}>
              {saveLabel ?? meta.strings.saveChanges}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export { StickySaveBar };
export type { StickySaveBarProps };
