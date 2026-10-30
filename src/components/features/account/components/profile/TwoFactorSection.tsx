"use client";

import { FormDialog, Row, Section, Switch } from "@/components/ui";
import { PasswordField } from "@/components/features/auth";
import type { TwoFactorState } from "../../hooks/profile/useTwoFactor";

/** Two-step sign-in: after the password, a 6-digit code emailed to you. */
export function TwoFactorSection({ twoFactor }: { twoFactor: TwoFactorState }) {
  if (!twoFactor.available) return null;
  const { enabled } = twoFactor;
  return (
    <Section title="Two-step sign-in" icon="shield-alt">
      <Row
        label={enabled ? "On" : "Off"}
        hint={
          enabled
            ? "Signing in with your password also asks for a code we email you."
            : "Add a code we email you to every sign-in with your password, so a stolen password isn't enough."
        }
        right={<Switch checked={enabled} onToggle={twoFactor.start} label="Two-step sign-in" />}
      />
      <FormDialog
        open={twoFactor.open}
        title={enabled ? "Turn off two-step sign-in" : "Turn on two-step sign-in"}
        description="Enter your password to confirm it's you."
        submitLabel={enabled ? "Turn off" : "Turn on"}
        onClose={twoFactor.close}
        onSubmit={twoFactor.submit}
      >
        <PasswordField
          label="Password"
          value={twoFactor.password}
          onChange={(e) => twoFactor.setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
        />
      </FormDialog>
    </Section>
  );
}
