"use client";

import { useApp } from "@/contexts/AppContext";
import { Badge, Button, Icon, IconButton, useDialog, useToast } from "@/components/ui";
import type { TeamMember, TeamRole, Workspace } from "@/types";
import { ROLES, ROLE_TONE } from "../constants";

type MemberControlsProps = {
  ws: Workspace;
  member: TeamMember;
  isAr: boolean;
  canGovern: boolean;
  editorsFull: boolean;
};

/** A team row's controls: make owner, the role, and remove — or just the role, for someone who can't govern. */
export function MemberControls({ ws, member: m, isAr, canGovern, editorsFull }: MemberControlsProps) {
  const { removeTeamMember, setTeamRole, transferOwnership } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const who = m.name || m.email;

  /**
   * Hands the brand over.
   *
   * Confirmed in words that say what is lost, not just what is gained: the
   * person doing this is giving up the ability to undo it. After it lands they
   * are an editor, so the control that did it is gone from their screen too —
   * which is why the guard is typing the brand's name rather than a second
   * click. A misclick can repeat a click; nothing can undo the result.
   */
  async function transfer() {
    const ok = await confirm({
      title: `Transfer ${ws.name}?`,
      body: (
        <>
          Ownership moves to <strong className="text-text">{who}</strong>. You stay on the brand as an editor, and this cannot be undone from your side.
        </>
      ),
      consequences: [
        "Only the new owner can change roles or approve proposals",
        "Only the new owner can transfer ownership again — including back to you",
        "Sharing, the client link and the subdomain move with it",
      ],
      confirmPhrase: ws.name,
      confirmLabel: "Transfer",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    transferOwnership(ws.id, m.id);
    showToast(`${who} is now the owner. You're an editor on this brand.`, "success");
  }

  async function remove() {
    const ok = await confirm({
      title: `Remove ${who}?`,
      body: "They lose access to this brand immediately. Anything they already edited stays.",
      confirmLabel: "Remove",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    removeTeamMember(ws.id, m.id);
    showToast(`${who} removed from the team.`);
  }

  if (!canGovern) return <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>;

  return (
    <div className="flex items-center gap-2">
      {/* Always rendered, disabled on the person who already owns the brand:
          hiding it on that row shifted every other row's controls sideways. */}
      <Button
        variant="soft"
        size="xs"
        disabled={m.role === "owner"}
        onClick={() => void transfer()}
        title={m.role === "owner" ? `${who} already owns ${ws.name}` : `Transfer ownership of ${ws.name} to ${who}`}
        icon={<Icon name="key" size={16} />}
        className="shrink-0"
      >
        Make owner
      </Button>
      <select
        aria-label={`Role for ${who}`}
        value={m.role}
        onChange={(e) => setTeamRole(ws.id, m.id, e.target.value as TeamRole)}
        className="cursor-pointer rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-secondary capitalize outline-none"
      >
        {ROLES.map((r) => (
          <option key={r} value={r} disabled={r === "editor" && editorsFull && m.role !== "editor"}>
            {r}
          </option>
        ))}
      </select>
      <IconButton
        icon="times"
        label={`Remove ${m.name}`}
        title={`Remove ${who} from this brand`}
        onClick={() => void remove()}
        className="mk-danger-hover cursor-pointer text-text-faint"
      />
    </div>
  );
}
