"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { removeAvatar, uploadAvatar } from "../../services/accountService";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

/** The profile photo: choose one (checked here first, then by the server), or remove it. */
export function useAvatar() {
  const { setServerAccount } = useApp();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function run(work: () => ReturnType<typeof removeAvatar>, done: string) {
    setBusy(true);
    try {
      setServerAccount(await work());
      showToast(done, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "danger");
    } finally {
      setBusy(false);
    }
  }

  function onPick(file: File | undefined) {
    if (!file) return;
    if (!TYPES.includes(file.type)) return showToast("Use a PNG, JPEG, WebP or GIF image.", "danger");
    if (file.size > MAX_BYTES) return showToast("That image is over 5 MB.", "danger");
    void run(() => uploadAvatar(file), "Photo updated.");
  }

  return {
    busy,
    accept: TYPES.join(","),
    onPick,
    remove: () => run(removeAvatar, "Photo removed."),
  };
}

export type AvatarState = ReturnType<typeof useAvatar>;
