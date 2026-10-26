"use client";

import { type FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, useToast } from "@/components/ui";
import { TextInput } from "@/components/form";
import type { TeamRole, Workspace } from "@/types";
import { RolePicker } from "./RolePicker";

type InviteMemberFormProps = {
  ws: Workspace;
  editorsFull: boolean;
  editorsFullNote: string;
  onDone: () => void;
};

/** Adds someone to the brand's team with a role. */
export function InviteMemberForm({
  ws,
  editorsFull,
  editorsFullNote,
  onDone,
}: InviteMemberFormProps) {
  const { addTeamMember } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("editor");
  // A full brand can't take another editor, so the invite falls back to viewer.
  const inviteRole: TeamRole =
    role === "editor" && editorsFull ? "viewer" : role;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    addTeamMember(ws.id, name.trim(), email.trim(), inviteRole);
    setName("");
    setEmail("");
    onDone();
    showToast("Team member added.", "success");
  }

  return (
    <form
      onSubmit={submit}
      className="mk-surface flex flex-col gap-2.5 rounded-xl bg-surface-2 p-4"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <TextInput
          fill="surface-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <TextInput
          fill="surface-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
      </div>
      <RolePicker
        value={inviteRole}
        onChange={setRole}
        editorsFull={editorsFull}
        editorsFullNote={editorsFullNote}
      />
      {editorsFull && (
        <p className="text-caption text-text-muted">{editorsFullNote}</p>
      )}
      <Button type="submit" variant="solid" size="sm" className="self-start">
        Add to team
      </Button>
    </form>
  );
}
