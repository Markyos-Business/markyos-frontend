import { api } from "@/lib/api/client";
import type { AnalysisState, CallNote, CallNotePage, DiscoveryFeed, FormOption, NoteDraft, NoteKind, ParsePreview } from "../types";

const note = (id: string, path = "") => `/call-notes/${id}/${path}`;

export type NoteListQuery = { brand: string; search?: string; kind?: NoteKind | ""; included?: boolean; deleted?: boolean; form?: string };

export const listNotes = (q: NoteListQuery) => {
  const params = new URLSearchParams({ brand: q.brand });
  if (q.search?.trim()) params.set("search", q.search.trim());
  if (q.kind) params.set("kind", q.kind);
  if (q.included !== undefined) params.set("included", String(q.included));
  if (q.deleted) params.set("deleted", "true");
  if (q.form) params.set("form", q.form);
  return api<CallNotePage>(`/call-notes/?${params}`);
};

export const getFeed = (brand: string) => api<DiscoveryFeed>(`/call-notes/feed/?brand=${encodeURIComponent(brand)}`);

export const getNote = (id: string) => api<CallNote>(note(id));

export const createNote = (brandId: string, draft: NoteDraft) => api<CallNote>("/call-notes/", { method: "POST", body: { brandId, ...draft } });

export const updateNote = (id: string, patch: Partial<NoteDraft> & { version: number }) => api<CallNote>(note(id), { method: "PATCH", body: patch });

export const deleteNote = (id: string) => api<void>(note(id), { method: "DELETE" });

export const restoreNote = (id: string) => api<CallNote>(note(id, "restore/"), { method: "POST" });

export const setIncluded = (id: string, include: boolean) => api<CallNote>(note(id, "include/"), { method: "POST", body: { include } });

export const previewText = (text: string, kind?: NoteKind) => api<ParsePreview>("/call-notes/parse/", { method: "POST", body: { text, kind } });

export const previewFile = (file: File) => {
  const body = new FormData();
  body.append("file", file);
  return api<ParsePreview>("/call-notes/parse/", { method: "POST", body });
};

/** The brand's discovery forms, for linking a call to one. */
export const listBrandForms = async (brand: string): Promise<FormOption[]> => {
  const page = await api<{ results: { id: string; name: string; status: string }[] }>(
    `/discovery/forms/?brand=${encodeURIComponent(brand)}&page_size=100`
  );
  return page.results.map((f) => ({ id: f.id, name: f.name }));
};

export const getAnalysis = (brand: string) => api<AnalysisState>(`/discovery/analysis/?brand=${encodeURIComponent(brand)}`);

export const runAnalysis = (brandId: string) => api<AnalysisState>("/discovery/analysis/", { method: "POST", body: { brandId } });
