"use client";

import { useResetPassword } from "../../hooks/reset/useResetPassword";
import { ResetConfirmStep } from "./ResetConfirmStep";
import { ResetRequestStep } from "./ResetRequestStep";
import { ResetSentStep } from "./ResetSentStep";

/** The reset flow, on whichever step it's at. */
export function ResetView() {
  const reset = useResetPassword();
  if (reset.step === "request") return <ResetRequestStep reset={reset} />;
  if (reset.step === "sent") return <ResetSentStep reset={reset} />;
  return <ResetConfirmStep reset={reset} />;
}
