"use client";

import { useRequest } from "@/hooks/useRequest";
import { getNote } from "../../api/call-notes.api";

export function useCallNote(noteId: string) {
  return useRequest(() => getNote(noteId), noteId);
}
