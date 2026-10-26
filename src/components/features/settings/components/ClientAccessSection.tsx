"use client";

import { useApp } from "@/contexts/AppContext";
import { Button, Icon, Row, Section, Switch } from "@/components/ui";
import { InputField } from "@/components/form";
import type { Workspace } from "@/types";
import { useCopy } from "../hooks/useCopy";
import { randomPassword } from "../utils/random";

/** The password in front of the client link, and the link itself. */
export function ClientAccessSection({ ws, clientLink }: { ws: Workspace; clientLink: string }) {
  const { toggleClientPassword, setClientPassword } = useApp();
  const copy = useCopy();
  const { password, passwordEnabled } = ws.clientAccess;
  return (
    <Section title="Client access" icon="lock">
      <Row
        label="Password-protect this guideline"
        hint="Clients enter this password before viewing the client link."
        right={<Switch label="Password-protect this guideline" checked={passwordEnabled} onToggle={() => toggleClientPassword(ws.id, !passwordEnabled)} />}
      />
      {passwordEnabled && (
        <div className="flex items-end gap-2.5">
          <InputField label="Password" value={password} onChange={(e) => setClientPassword(ws.id, e.target.value)} placeholder="Set a password" />
          {/* Shown in the clear on purpose — the studio reads it out to a
              client — so it gets a Copy, like the client link below. */}
          <Button
            variant="soft"
            onClick={() => void copy(password, "Password")}
            disabled={!password}
            title={password ? "Copy the password" : "Set a password first"}
            className="shrink-0 shadow-edge"
          >
            Copy
          </Button>
          <Button variant="soft" onClick={() => setClientPassword(ws.id, randomPassword())} title="Replace it with a new random one" className="shrink-0 shadow-edge">
            Generate
          </Button>
        </div>
      )}
      <div className="mk-surface flex items-center gap-2.5 rounded-lg bg-surface-2 px-3.5 py-3">
        <Icon name="link" size={17} className="text-accent-text" />
        <span
          // The full link in a title: this truncates on a narrow window, and a
          // URL you can only read most of is a URL you cannot check.
          title={clientLink}
          className="min-w-0 flex-1 truncate font-mono text-[12px] text-text-secondary"
        >
          {clientLink}
        </span>
        <Button variant="link" onClick={() => void copy(clientLink, "Client link")} className="shrink-0 text-[12px] font-semibold">
          Copy
        </Button>
      </div>
    </Section>
  );
}
