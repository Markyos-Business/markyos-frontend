"use client";

import { useId, useState } from "react";
import type { ReactNode, Ref } from "react";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { useUiStrings } from "../ui-strings";
import { FieldLabel, InputField } from "./input-field";

type ConfirmByTypingProps = {
  /** What must be typed: "Ramadan 2027". */
  name: string;
  /** The destructive action: "Delete campaign". */
  actionLabel: string;
  onConfirm: () => void | Promise<void>;
  /** With a Dialog: a Cancel button beside the action. */
  onCancel?: () => void;
  /** What will be lost, in one sentence. */
  description?: string;
  /** "ramadan 2027" counts too. Default false: the case must match. */
  ignoreCase?: boolean;
  /** Let a paste in. Default false: typing it is the point. */
  allowPaste?: boolean;
  /** The action is running: the button spins and stays disabled. */
  busy?: boolean;
  /** Focus the input on mount, as the first thing in a Dialog. */
  autoFocus?: boolean;
  /** The input's form name, and its element for a form library. */
  inputName?: string;
  ref?: Ref<HTMLInputElement>;
  labels?: {
    /** The prompt around the bold name. */
    typeToConfirm?: (name: ReactNode) => ReactNode;
    doesntMatch?: string;
    matches?: string;
    pasteBlocked?: string;
    cancel?: string;
    /** When `onConfirm` rejects. */
    failed?: string;
  };
};

/**
 * A guard on something that can't be undone. "Type Ramadan 2027 to confirm"
 * with the name in bold; the destructive button stays disabled until the text
 * matches exactly (ends trimmed; case-sensitive unless `ignoreCase`). Pasting
 * is blocked by default, with a note why. When it matches, that's announced
 * and the field shows success; Enter then confirms.
 *
 * Made to sit in a Dialog (pass `onCancel` and `autoFocus`), and works on a
 * page too. The name is isolated, so a Latin name reads correctly in Arabic.
 */
const ConfirmByTyping = ({
  name,
  actionLabel,
  onConfirm,
  onCancel,
  description,
  ignoreCase = false,
  allowPaste = false,
  busy = false,
  autoFocus = false,
  inputName,
  ref,
  labels,
}: ConfirmByTypingProps) => {
  const { t } = useUiStrings();
  const id = useId();
  const [typed, setTyped] = useState("");
  const [tried, setTried] = useState(false);
  const [pasted, setPasted] = useState(false);
  // While `onConfirm` runs, whether or not the caller passes `busy`: a second press can't run it twice.
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const working = busy || pending;
  const same = (a: string, b: string) => (ignoreCase ? a.toLocaleLowerCase() === b.toLocaleLowerCase() : a === b);
  const matches = same(typed.trim(), name.trim());
  const prompt = (labels?.typeToConfirm ?? t.typeToConfirm)(
    <bdi dir="auto" className="font-medium text-text">
      {name}
    </bdi>,
  );

  const confirm = async () => {
    if (!matches || working) {
      setTried(true);
      return;
    }
    setFailed(false);
    setPending(true);
    try {
      await onConfirm();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    // A group, not a form, so it can sit inside a form (or a Dialog's form) of its own.
    <div role="group" aria-busy={working || undefined} className="flex flex-col gap-space-5">
      {description && (
        <p className="flex items-start gap-space-3 text-body text-text">
          <Icon name="exclamation-circle" size={18} className="mt-0.5 shrink-0 text-danger" />
          {description}
        </p>
      )}
      <div className="flex flex-col gap-space-2">
        <FieldLabel htmlFor={id}>{prompt}</FieldLabel>
        <InputField
          id={id}
          ref={ref}
          name={inputName}
          value={typed}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          disabled={working}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void confirm();
            }
          }}
          onChange={(e) => {
            setTyped(e.target.value);
            setTried(false);
            setPasted(false);
          }}
          onPaste={(e) => {
            if (allowPaste) return;
            e.preventDefault();
            setPasted(true);
          }}
          onDrop={(e) => {
            if (!allowPaste) e.preventDefault();
          }}
          error={tried && !matches ? (labels?.doesntMatch ?? t.doesntMatch) : undefined}
          warning={pasted ? (labels?.pasteBlocked ?? t.pasteBlocked) : undefined}
          success={matches ? (labels?.matches ?? t.confirmMatches) : undefined}
        />
      </div>
      {failed && (
        <p role="alert" className="text-caption text-danger">
          {labels?.failed ?? t.confirmFailed}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-space-3">
        <Button type="button" variant="danger" onClick={() => void confirm()} disabled={!matches || working} icon={<Icon name={working ? "circle-notch" : "trash"} size={18} className={working ? "animate-spin" : ""} />}>
          {actionLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={working}>
            {labels?.cancel ?? t.cancel}
          </Button>
        )}
      </div>
    </div>
  );
};

export { ConfirmByTyping };
export type { ConfirmByTypingProps };
