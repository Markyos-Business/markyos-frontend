"use client";

import { useResetPassword } from "../../hooks/reset/use-reset-password";
import { ResetConfirmStep } from "./reset-confirm-step";
import { ResetRequestStep } from "./reset-request-step";
import { ResetSentStep } from "./reset-sent-step";

/** The reset flow, on whichever step it's at. */
export function ResetView() {
  const reset = useResetPassword();
  if (reset.step === "request") return <ResetRequestStep reset={reset} />;
  if (reset.step === "sent") return <ResetSentStep reset={reset} />;
  return <ResetConfirmStep reset={reset} />;
}
