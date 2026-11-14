"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import { formatRelative } from "@/lib/utils";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { useFormMeta } from "./form-context";

type AutosaveProps = {
  /** Saves the whole form's values. Reject to show "Couldn't save." with Retry. */
  onSave: (values: FieldValues) => Promise<void>;
  /** Quiet time after the last change before saving. Default 800ms. */
  debounceMs?: number;
  /** Keep unsaved changes on this device under this key while offline or failing; sent when back. */
  storageKey?: string;
  /** When it was last saved (from the server), for "Saved 2h ago" before any edit. */
  savedAt?: number;
};

type Status = "idle" | "saving" | "saved" | "failed" | "offline" | "invalid";

const subscribeOnline = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
};

const readDraft = (key?: string): FieldValues | null => {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as FieldValues) : null;
  } catch {
    return null;
  }
};
const writeDraft = (key: string | undefined, values: FieldValues | null) => {
  if (!key) return;
  try {
    if (values) window.localStorage.setItem(key, JSON.stringify(values));
    else window.localStorage.removeItem(key);
  } catch {
    // No storage: offline changes live only as long as the page.
  }
};

/**
 * Saves a Form as it's edited, with no Save button: a pause in typing saves
 * the changed fields once they pass their checks (a field with an error
 * waits, and the line says so). One save at a time; changes made during a
 * save go in the next.
 *
 * The line beside it says where things stand: "Saving…", "Saved 10m ago"
 * (kept current), or "Couldn't save." with Retry. Offline, changes are kept
 * on this device (with `storageKey`) and sent the moment the connection is
 * back, and a draft left from an earlier visit is picked up the same way.
 * Status changes are announced politely; a failure as an alert.
 */
const Autosave = ({ onSave, debounceMs = 800, storageKey, savedAt }: AutosaveProps) => {
  const { t, lang } = useUiStrings();
  const meta = useFormMeta();
  const { watch, getValues, reset, formState } = useFormContext();
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [status, setStatus] = useState<Status>("idle");
  const [lastSaved, setLastSaved] = useState<number | undefined>(savedAt);
  const [draftRestored, setDraftRestored] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const saving = useRef(false);
  const again = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  // Read during render, so react-hook-form keeps them current for the save below.
  const dirtyFields = formState.dirtyFields;
  const dirty = formState.isDirty;
  const dirtyRef = useRef({ dirtyFields, dirty });
  useEffect(() => {
    dirtyRef.current = { dirtyFields, dirty };
  });

  const save = async () => {
    if (saving.current) {
      again.current = true;
      return;
    }
    if (!dirtyRef.current.dirty) return;
    const changed = Object.keys(dirtyRef.current.dirtyFields);
    if (changed.length && !(await meta.validate(changed))) {
      setStatus("invalid");
      return;
    }
    const values = getValues();
    if (!navigator.onLine) {
      writeDraft(storageKey, values);
      setStatus("offline");
      return;
    }
    saving.current = true;
    setStatus("saving");
    try {
      await onSave(values);
      // What was sent is the new clean state; anything typed since stays.
      reset(values, { keepValues: true });
      writeDraft(storageKey, null);
      setLastSaved(Date.now());
      setNow(Date.now());
      setStatus("saved");
    } catch {
      writeDraft(storageKey, values);
      setStatus("failed");
    } finally {
      saving.current = false;
      if (again.current) {
        again.current = false;
        void saveRef.current();
      }
    }
  };
  // The latest save, for timers and listeners set up earlier.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  // A pause after the last change saves.
  useEffect(() => {
    const sub = watch((_v, { type }) => {
      if (type !== "change") return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void saveRef.current(), debounceMs);
    });
    return () => {
      sub.unsubscribe();
      window.clearTimeout(timer.current);
    };
  }, [watch, debounceMs]);

  // A draft from an earlier visit (or before going offline) comes back as unsaved changes, once.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = readDraft(storageKey);
    if (!draft) return;
    reset(draft, { keepDefaultValues: true });
    // A one-time read of browser storage, which the first render can't do.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftRestored(true);
  }, [storageKey, reset]);

  // Back online (or a draft restored while online): send what was kept.
  useEffect(() => {
    if (!online || (status !== "offline" && !draftRestored)) return;
    const frame = requestAnimationFrame(() => {
      setDraftRestored(false);
      void saveRef.current();
    });
    return () => cancelAnimationFrame(frame);
  }, [online, status, draftRestored]);

  // "Saved 10m ago" stays true as time passes.
  useEffect(() => {
    if (!lastSaved) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [lastSaved]);

  const shown: Status = !online && dirty ? "offline" : status;
  const text =
    shown === "saving"
      ? meta.strings.autoSaving
      : shown === "failed"
        ? meta.strings.autoFailed
        : shown === "offline"
          ? meta.strings.autoOffline
          : shown === "invalid"
            ? meta.strings.autoInvalid
            : draftRestored
              ? meta.strings.autoDraft
              : lastSaved
                ? meta.strings.autoSaved(formatRelative(lastSaved, now, lang))
                : "";
  const icon = shown === "saving" ? "circle-notch" : shown === "failed" || shown === "invalid" ? "exclamation-circle" : shown === "offline" ? "info-circle" : lastSaved ? "check" : null;

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-space-3 text-caption">
      <span role={shown === "failed" ? "alert" : "status"} aria-live={shown === "failed" ? "assertive" : "polite"} className={`flex items-center gap-space-2 ${shown === "failed" || shown === "invalid" ? "text-danger" : "text-text-muted"}`}>
        {icon && <Icon name={icon} size={16} className={shown === "saving" ? "animate-spin" : shown === "saved" || (!!lastSaved && shown === "idle") ? "text-success" : ""} />}
        {text}
      </span>
      {shown === "failed" && (
        <Button type="button" variant="outline" size="xs" onClick={() => void saveRef.current()}>
          {meta.strings.retry ?? t.retry}
        </Button>
      )}
    </div>
  );
};

export { Autosave };
export type { AutosaveProps };
