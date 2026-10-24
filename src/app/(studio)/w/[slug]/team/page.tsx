"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, accountTypeOf, limitsOf } from "@/constants/accountTypes";
import { useToast, useDialog, Icon, Button, Section, Row, Badge, EmptyHint } from "@/components/ui";
import { TopBar } from "@/components/layout";
import { TeamRole } from "@/types";
import { roleOn } from "@/lib/data/access";
import { formatRelative } from "@/lib/utils";

const ROLES: TeamRole[] = ["owner", "editor", "viewer", "client"];
const ROLE_TONE: Record<TeamRole, "accent" | "success" | "neutral" | "warning"> = {
  owner: "accent",
  editor: "success",
  viewer: "neutral",
  client: "warning",
};

export default function TeamPage() {
  const params = useParams<{ slug: string }>();
  const {
    getWorkspace,
    state,
    addTeamMember,
    removeTeamMember,
    setTeamRole,
    transferOwnership,
    proposeApproval,
    resolveApproval,
    saveVersionSnapshot,
    restoreVersion,
    resolveSignOffPin,
    uiLang,
  } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const account = useCurrentAccount();
  const ws = getWorkspace(params.slug);

  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<TeamRole>("editor");
  const [proposalText, setProposalText] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("");

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";

  const myRole: TeamRole = roleOn(ws, state.session) ?? "viewer";
  const canGovern = myRole === "owner";
  /*
   * Editor seats, by the owner's account type (constants/accountTypes.ts).
   * Only owners change the team, so the signed-in account is the owner here.
   * The server refuses the same thing; this says so before anyone tries.
   */
  const editorLimit = limitsOf(account).editors;
  const editorsFull = canGovern && editorLimit !== null && ws.team.filter((m) => m.role === "editor").length >= editorLimit;
  const editorsFullNote =
    editorLimit === 0
      ? `${ACCOUNT_TYPES[accountTypeOf(account)].label} accounts work solo, so they can't add editors. Add people as a viewer or client.`
      : `This brand has its ${editorLimit} editor seats filled. Add people as a viewer or client.`;
  // A full brand can't take another editor, so the invite falls back to viewer.
  const inviteRole: TeamRole = memberRole === "editor" && editorsFull ? "viewer" : memberRole;
  const openPins = ws.signOffPins.filter((p) => !p.resolved);
  const actorName = state.session?.name || state.session?.email || "You";

  function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return;
    addTeamMember(ws!.id, memberName.trim(), memberEmail.trim(), inviteRole);
    setMemberName("");
    setMemberEmail("");
    setAddingMember(false);
    showToast("Team member added.", "success");
  }

  function handlePropose(e: FormEvent) {
    e.preventDefault();
    if (!proposalText.trim()) return;
    proposeApproval(ws!.id, proposalText.trim(), actorName);
    setProposalText("");
    showToast("Change proposed — waiting on an owner to review.", "success");
  }

  /**
   * Hands the brand over.
   *
   * Confirmed in words that say what is lost, not just what is gained: the
   * person doing this is giving up the ability to undo it, and "Are you sure?"
   * doesn't tell them that. After it lands they are an editor, so the control
   * that did it is gone from their screen too — which is exactly why the guard
   * is typing the brand's name rather than a second click. A click is the same
   * gesture that opened the dialog; a misclick can repeat it, and nothing in
   * this product can undo the result.
   */
  async function handleTransfer(memberId: string, memberName: string) {
    const ok = await confirm({
      title: `Transfer ${ws!.name}?`,
      body: (
        <>
          Ownership moves to <strong style={{ color: "var(--text)" }}>{memberName}</strong>. You stay
          on the brand as an editor, and this cannot be undone from your side.
        </>
      ),
      consequences: [
        "Only the new owner can change roles or approve proposals",
        "Only the new owner can transfer ownership again — including back to you",
        "Sharing, the client link and the subdomain move with it",
      ],
      confirmPhrase: ws!.name,
      confirmLabel: "Transfer",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    transferOwnership(ws!.id, memberId);
    showToast(`${memberName} is now the owner. You're an editor on this brand.`, "success");
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    const ok = await confirm({
      title: `Remove ${memberName}?`,
      body: "They lose access to this brand immediately. Anything they already edited stays.",
      confirmLabel: "Remove",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    removeTeamMember(ws!.id, memberId);
    showToast(`${memberName} removed from the team.`);
  }

  function handleSaveSnapshot() {
    saveVersionSnapshot(ws!.id, snapshotLabel.trim() || "Untitled version", actorName);
    setSnapshotLabel("");
    showToast("Version saved.", "success");
  }

  return (
    <>
      <TopBar workspace={ws} section="Team & history" arSection="الفريق والإصدارات" />
      <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-6 overflow-auto max-w-[820px]">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {isAr ? "الفريق والإصدارات" : "Team & history"}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Who can change what, who approved it, and how to undo a mistake. You&apos;re signed in as{" "}
            <Badge tone={ROLE_TONE[myRole]}>{myRole}</Badge>
            {" "}on this brand.
          </p>
          {/*
            Architecture principle 7: no UI promise without server enforcement.
            These roles decide what this interface offers, and nothing more —
            every check runs in the browser against state the browser owns, so
            anyone with devtools can hand themselves any role. Saying so is the
            only honest option until the Data Access Layer exists to enforce it.
          */}
          <p className="text-[12.5px] mt-2" style={{ color: "var(--text-faint)" }}>
            Roles shape this interface but are not a security boundary yet — every check still runs
            in the browser. Real enforcement arrives with the server.
          </p>
        </div>

        {/* Team & roles */}
        <Section
          title="Team"
          icon="users"
          right={
            <button
              type="button"
              onClick={() => setAddingMember((v) => !v)}
              className="mk-tap text-[12px] font-semibold cursor-pointer"
              style={{ color: "var(--accent-text)" }}
            >
              {addingMember ? "Cancel" : "+ Invite"}
            </button>
          }
        >
          {addingMember && (
            <form onSubmit={handleAddMember} className="mk-surface rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "var(--surface-2)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Name"
                  className="h-10 px-3 rounded-lg outline-none text-[13px]"
                  style={{ background: "var(--surface-1)", color: "var(--text)" }}
                />
                <input
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Email"
                  className="h-10 px-3 rounded-lg outline-none text-[13px]"
                  style={{ background: "var(--surface-1)", color: "var(--text)" }}
                />
              </div>
              <div className="flex gap-1.5">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={r === "editor" && editorsFull}
                    title={r === "editor" && editorsFull ? editorsFullNote : undefined}
                    onClick={() => setMemberRole(r)}
                    className="h-8 px-3 rounded-full text-[11px] font-semibold capitalize cursor-pointer"
                    style={{
                      // Was a literal white-on-near-black pill, which is a
                      // white chip on a white card in the light theme.
                      background: inviteRole === r ? "var(--solid)" : "var(--surface-1)",
                      color: inviteRole === r ? "var(--solid-ink)" : "var(--text-muted)",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {editorsFull && <p className="text-caption text-text-muted">{editorsFullNote}</p>}
              <button type="submit" className="h-9 rounded-lg text-[12px] font-semibold cursor-pointer self-start px-4" style={{ background: "var(--solid)", color: "var(--solid-ink)" }}>
                Add to team
              </button>
            </form>
          )}
          {ws.team.length === 0 ? (
            <EmptyHint>Just you so far. Invite an editor or a client viewer to see roles in action.</EmptyHint>
          ) : (
            <div className="flex flex-col gap-2">
              {ws.team.map((m) => (
                <Row
                  key={m.id}
                  label={m.name}
                  hint={m.email}
                  right={
                    <div className="flex items-center gap-2">
                      {/*
                       * Always rendered while you can govern, disabled on the
                       * person who already owns the brand.
                       *
                       * Hiding it on that one row shifted the role control and
                       * the remove button sideways for every other row, so the
                       * column of controls did not line up and could not be
                       * scanned — and the owner's row said nothing about why
                       * the transfer was missing, which reads as a bug rather
                       * than as an answer.
                       */}
                      {canGovern && (
                        <button
                          type="button"
                          disabled={m.role === "owner"}
                          onClick={() => void handleTransfer(m.id, m.name || m.email)}
                          title={
                            m.role === "owner"
                              ? `${m.name || m.email} already owns ${ws.name}`
                              : `Transfer ownership of ${ws.name} to ${m.name || m.email}`
                          }
                          className="h-7 px-2.5 rounded-full text-[11px] font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed"
                          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                        >
                          <Icon name="key" size={11} />
                          Make owner
                        </button>
                      )}
                      {canGovern ? (
                        <select
                          aria-label={`Role for ${m.name || m.email}`}
                          value={m.role}
                          onChange={(e) => setTeamRole(ws.id, m.id, e.target.value as TeamRole)}
                          className="text-[11px] font-semibold rounded-full px-2.5 py-1 outline-none capitalize cursor-pointer"
                          style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r} disabled={r === "editor" && editorsFull && m.role !== "editor"}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>
                      )}
                      {canGovern && (
                        <button type="button" onClick={() => void handleRemoveMember(m.id, m.name || m.email)} aria-label={`Remove ${m.name}`} title={`Remove ${m.name || m.email} from this brand`} className="mk-icon-btn mk-danger-hover cursor-pointer">
                          <Icon name="times" size={14} style={{ color: "var(--text-faint)" }} />
                        </button>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </Section>

        {/*
          Client sign-off.
          Clients leave these on the published guideline, section by section.
          Resolving them belongs here rather than on the guideline itself: the
          client should not be able to close their own note, and the `resolved`
          state existed with nothing able to reach it — a state the UI drew and
          nobody could produce.
        */}
        <Section
          title="Client sign-off"
          icon="map-marker"
          right={
            openPins.length > 0 ? (
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {openPins.length} open
              </span>
            ) : undefined
          }
        >
          {ws.signOffPins.length === 0 ? (
            <EmptyHint>
              Nothing yet. Clients leave notes on each section of the published guideline, and they
              land here.
            </EmptyHint>
          ) : (
            <div className="flex flex-col gap-2.5">
              {[...ws.signOffPins]
                .sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.createdAt - a.createdAt)
                .map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl p-3.5 flex items-start gap-3"
                    style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
                  >
                    <Icon
                      name={p.resolved ? "check-circle" : "map-marker"}
                      size={14}
                      style={{ color: p.resolved ? "var(--success)" : "var(--warning)", marginTop: 2, flexShrink: 0 }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span dir="auto" className="bidi-auto text-[13px] font-semibold">{p.authorName}</span>
                        <Badge tone="neutral">{p.section}</Badge>
                        <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                          {formatRelative(p.createdAt)}
                        </span>
                      </div>
                      <p
                        dir="auto"
                        className="bidi-auto text-[13px] leading-[1.6] mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {p.note}
                      </p>
                    </div>
                    {!p.resolved && canGovern && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          resolveSignOffPin(ws.id, p.id);
                          showToast("Marked as handled.", "success");
                        }}
                      >
                        Mark handled
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Section>

        {/* Approvals */}
        <Section title="Approval queue" icon="check-circle">
          <form onSubmit={handlePropose} className="flex items-end gap-2.5">
            <input
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              aria-label="Describe the change you're proposing"
              placeholder="Propose a change — e.g. add a new secondary color"
              className="flex-1 h-10 px-3 rounded-lg outline-none text-[13px]"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            />
            <button type="submit" className="h-10 px-4 rounded-lg text-[12px] font-semibold cursor-pointer shrink-0" style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}>
              Propose
            </button>
          </form>
          {ws.approvals.length === 0 ? (
            <EmptyHint>No proposals yet. Editors propose changes here; owners approve or reject them.</EmptyHint>
          ) : (
            <div className="flex flex-col gap-2">
              {ws.approvals.map((a) => (
                <div key={a.id} className="mk-surface rounded-xl p-3.5 flex items-start gap-3" style={{ background: "var(--surface-2)" }}>
                  <Icon
                    name={a.status === "approved" ? "check-circle" : a.status === "rejected" ? "exclamation-circle" : "clock"}
                    size={16}
                    style={{
                      color: a.status === "approved" ? "var(--success)" : a.status === "rejected" ? "var(--danger)" : "var(--warning)",
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{a.summary}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {a.proposedBy} · {formatRelative(a.createdAt)}
                      {a.reviewNote ? ` · "${a.reviewNote}"` : ""}
                    </div>
                  </div>
                  {a.status === "pending" ? (
                    canGovern ? (
                      <div className="flex gap-space-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => resolveApproval(ws.id, a.id, "approved")}
                          className="mk-btn h-control-sm px-space-5 rounded-lg text-body font-medium bg-success-soft text-success"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveApproval(ws.id, a.id, "rejected")}
                          className="mk-btn h-control-sm px-space-5 rounded-lg text-body font-medium bg-danger-soft text-danger"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <Badge tone="warning">Pending</Badge>
                    )
                  ) : (
                    <Badge tone={a.status === "approved" ? "success" : "danger"}>{a.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Version history */}
        <Section title="Version history" icon="history">
          <div className="flex items-end gap-2.5">
            <input
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              aria-label="Label for this saved version"
              placeholder="Label this version — e.g. Before campaign refresh"
              className="flex-1 h-10 px-3 rounded-lg outline-none text-[13px]"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            />
            <Button variant="outline" size="sm" onClick={handleSaveSnapshot}>
              Save current as version
            </Button>
          </div>
          {ws.versionHistory.length === 0 ? (
            <EmptyHint>No saved versions yet — save one before a risky edit so it&apos;s easy to undo.</EmptyHint>
          ) : (
            <div className="flex flex-col gap-2">
              {ws.versionHistory.map((v) => (
                <Row
                  key={v.id}
                  label={v.label}
                  hint={`${v.createdBy} · ${formatRelative(v.createdAt)} · ${v.colors.length} colors`}
                  right={
                    <button
                      type="button"
                      onClick={() => {
                        // Restoring overwrites the live brand. It was a single
                        // click next to a list of dates — the easiest way in
                        // this product to lose an afternoon's work by aiming
                        // one row off.
                        void (async () => {
                          const ok = await confirm({
                            title: `Restore "${v.label}"?`,
                            body: `This replaces the brand's current colours and type with the ones saved ${formatRelative(
                              v.createdAt
                            )}. Save the current state as a version first if you want a way back.`,
                            confirmLabel: "Restore",
                            tone: "danger",
                            isAr,
                          });
                          if (!ok) return;
                          restoreVersion(ws.id, v.id);
                          showToast(`Restored "${v.label}".`, "success");
                        })();
                      }}
                      className="h-8 px-3.5 rounded-full text-[11px] font-semibold cursor-pointer"
                      style={{ background: "var(--surface-2)", color: "var(--accent-text)", boxShadow: "inset 0 0 0 1px var(--accent-ring)" }}
                    >
                      Restore
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
