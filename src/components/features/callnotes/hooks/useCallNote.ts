"use client";

import { useRequest } from "@/hooks/useRequest";
import { getNote } from "../services/callNotesService";

export function useCallNote(noteId: string) {
  return useRequest(() => getNote(noteId), noteId);
}
