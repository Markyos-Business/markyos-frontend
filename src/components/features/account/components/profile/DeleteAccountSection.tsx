"use client";

import { Button, FormDialog, Icon, Row, Section } from "@/components/ui";
import { InputField } from "@/components/form";
import { PasswordField } from "@/components/features/auth";
import type { Account } from "@/types";
import type { DeleteAccountState } from "../../hooks/useDeleteAccount";

type DeleteAccountSectionProps = { account: Account; deletion: DeleteAccountState };

/** The way out: delete the account and everything it owns, now. */
export function DeleteAccountSection({ account, deletion }: DeleteAccountSectionProps) {
  const { ownedCount, people } = deletion;
  return (
    <Section title="Delete account" icon="trash">
      <Row
        label="Delete your account"
        hint="Deletes your account and the brands you own straight away. It can't be undone."
        right={
          <Button variant="danger" size="sm" icon={<Icon name="trash" size={16} />} onClick={deletion.start}>
            Delete account
          </Button>
        }
      />
      <FormDialog
        open={deletion.open}
        title="Delete your account?"
        description={
          <ul className="flex list-disc flex-col gap-space-2 ps-space-6">
            <li>
              {ownedCount === 0
                ? "You don\u2019t own any brands."
                : `${ownedCount} brand${ownedCount === 1 ? "" : "s"} you own ${ownedCount === 1 ? "is" : "are"} deleted, with everything in ${ownedCount === 1 ? "it" : "them"}.`}
            </li>
            {people > 0 && (
              <li>
                {people} {people === 1 ? "person loses" : "people lose"} access to them.
              </li>
            )}
            <li>{"You\u2019re taken off every brand you\u2019re on as a team member."}</li>
            <li>{"This can\u2019t be undone."}</li>
          </ul>
        }
        submitLabel="Delete account"
        onClose={deletion.close}
        onSubmit={deletion.submit}
      >
        {deletion.hasPassword ? (
          <PasswordField
            label="Enter your password to confirm"
            value={deletion.proof}
            onChange={(e) => deletion.setProof(e.target.value)}
            autoComplete="current-password"
            autoFocus
          />
        ) : (
          <InputField
            label={`Type ${account.email} to confirm`}
            type="email"
            dir="ltr"
            value={deletion.proof}
            onChange={(e) => deletion.setProof(e.target.value)}
            autoFocus
          />
        )}
      </FormDialog>
    </Section>
  );
}
