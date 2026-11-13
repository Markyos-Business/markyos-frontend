"use client";

import { useState } from "react";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { InputField } from "../field/input-field";
import { useUiStrings } from "../ui-strings";

type ConfirmByTypingProps = {
  /** What must be typed, exactly: the brand or account name. */
  name: string;
  /** The destructive action's label: "Delete brand". */
  actionLabel: string;
  onConfirm: () => void | Promise<void>;
  /** What will be lost, in one sentence. */
  description?: string;
  /** The action is running. */
  busy?: boolean;
  strings?: { typeToConfirm?: (name: string) => string; doesntMatch?: string };
};

/**
 * A guard on something that can't be undone: the action stays disabled until
 * the exact name is typed (spaces at the ends don't count). The name is shown
 * left to right inside the sentence so a Latin name reads correctly in
 * Arabic. Enter confirms once it matches.
 */
const ConfirmByTyping = ({ name, actionLabel, onConfirm, description, busy = false, strings }: ConfirmByTypingProps) => {
  const { t } = useUiStrings();
  const [typed, setTyped] = useState("");
  const [tried, setTried] = useState(false);
  const matches = typed.trim() === name;
  const prompt = (strings?.typeToConfirm ?? t.typeToConfirm)(`⁨${name}⁩`);

  return (
    <form
      className="flex flex-col gap-space-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (matches && !busy) void onConfirm();
        else setTried(true);
      }}
    >
      {description && (
        <p className="flex items-start gap-space-3 text-body text-text">
          <Icon name="exclamation-circle" size={18} className="mt-0.5 shrink-0 text-danger" />
          {description}
        </p>
      )}
      <InputField
        label={prompt}
        value={typed}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setTyped(e.target.value);
          setTried(false);
        }}
        error={tried && !matches ? (strings?.doesntMatch ?? t.doesntMatch) : undefined}
        success={matches ? " " : undefined}
      />
      <div>
        <Button type="submit" variant="danger" disabled={!matches || busy} icon={<Icon name={busy ? "circle-notch" : "trash"} size={18} className={busy ? "animate-spin" : ""} />}>
          {actionLabel}
        </Button>
      </div>
    </form>
  );
};

export { ConfirmByTyping };
export type { ConfirmByTypingProps };
