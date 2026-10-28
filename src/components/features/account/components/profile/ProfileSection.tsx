"use client";

import { Avatar, Section } from "@/components/ui";
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
          hint="This is the address you sign in with."
        />
      </div>
    </Section>
  );
}
