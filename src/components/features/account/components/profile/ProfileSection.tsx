"use client";

import { Avatar, Button, Section } from "@/components/ui";
import { InputField } from "@/components/form";
import { initialsFor } from "@/lib/utils";
import type { Account } from "@/types";
import type { ProfileDetailsState } from "../../hooks/useProfileDetails";

/** Who you are: avatar, name and the email you sign in with. */
export function ProfileSection({ account, details }: { account: Account; details: ProfileDetailsState }) {
  return (
    <Section title="Profile" icon="user">
      <div className="flex items-center gap-4">
        <Avatar initials={initialsFor(account.name || account.email)} size={56} tone="accent" />
        <div className="min-w-0">
          <div dir="auto" className="bidi-auto text-h5 font-medium truncate">{account.name}</div>
          <div dir="ltr" className="text-caption truncate text-text-muted">{account.email}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <InputField
          label="Name"
          value={details.name}
          dir="auto"
          onChange={(e) => details.setName(e.target.value)}
          onBlur={details.commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") details.resetName();
          }}
          placeholder="Your name"
        />
        <InputField
          label="Email"
          type="email"
          value={details.email}
          dir="ltr"
          error={details.emailError}
          onChange={(e) => details.setEmail(e.target.value)}
          onBlur={details.commitEmail}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") details.resetEmail();
          }}
          placeholder="you@studio.com"
          hint={
            details.pendingEmail
              ? undefined
              : "This is the address you sign in with. A new one is confirmed from its inbox first."
          }
        />
      </div>

      {details.pendingEmail && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-widget bg-surface-sunken px-space-6 py-space-4 shadow-edge-soft">
          <p className="text-caption text-text-muted">
            Waiting for confirmation:{" "}
            <span dir="ltr" className="font-medium text-text">
              {details.pendingEmail}
            </span>
            . Until then you sign in with {account.email}.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={details.resendPending}>
              Resend
            </Button>
            <Button type="button" variant="link" onClick={details.cancelPending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
