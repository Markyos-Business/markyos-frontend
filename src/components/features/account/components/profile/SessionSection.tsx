"use client";

import { useApp } from "@/contexts/AppContext";
import { Button, Icon, Row, Section, useToast } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { Account } from "@/types";

/** This browser's sign-in, and the way out of it. */
export function SessionSection({ account }: { account: Account }) {
  const { logout } = useApp();
  const { showToast } = useToast();
  return (
    <Section title="Session" icon="lock">
      <Row
        label="Signed in"
        hint={`Since this browser last authenticated${account.createdAt ? ` · account created ${formatRelative(account.createdAt)}` : ""}.`}
        right={
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            icon={<Icon name="sign-out-alt" size={16} />}
            onClick={() => {
              logout();
              showToast("Signed out.");
            }}
          >
            Sign out
          </Button>
        }
      />
    </Section>
  );
}
