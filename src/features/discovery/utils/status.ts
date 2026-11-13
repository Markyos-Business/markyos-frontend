import type { FormStatus } from "../types";

/*
 * The status machine's client-side view. The server enforces it
 * (apps/discovery/status.py); this mirror only decides what the studio is
 * offered and warned about, so a button never promises a move the server
 * would refuse.
 */

export type FormAction = "send" | "answer" | "submit" | "reopen";

const TRANSITIONS: Record<FormAction, Partial<Record<FormStatus, FormStatus>>> = {
  send: { draft: "sent", sent: "sent", in_progress: "in_progress" },
  answer: { sent: "in_progress", in_progress: "in_progress" },
  submit: { sent: "submitted", in_progress: "submitted" },
  reopen: { submitted: "in_progress" },
};

/** The status after `action`, or null when the move isn't allowed. */
export const nextStatus = (status: FormStatus, action: FormAction): FormStatus | null => TRANSITIONS[action][status] ?? null;

export type FormChange = "wording" | "add_optional_question" | "add_required_question" | "structure" | "theme" | "settings";

const SAFE_AFTER_SEND: FormChange[] = ["wording", "add_optional_question", "theme", "settings"];

/** Why `change` can't be made to a form in `status`, or null. */
export const editRefusal = (status: FormStatus, change: FormChange): string | null => {
  if (status === "draft") return null;
  if (status === "submitted" && change !== "theme" && change !== "settings") return "This form was submitted. Reopen it to change its questions.";
  if (SAFE_AFTER_SEND.includes(change)) return null;
  return "This form has been sent, so only wording, help text and new optional questions can change without breaking answers already given.";
};
