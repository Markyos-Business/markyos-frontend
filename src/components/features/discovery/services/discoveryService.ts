import { api } from "@/lib/api/client";
import type {
  DiscoveryForm,
  FormListPage,
  FormListQuery,
  FormPatch,
  LibraryPage,
  LibraryQuery,
  LocalizedText,
  NewForm,
  QuestionDraft,
  ResponsesView,
  TemplateWithPreview,
} from "../types";

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && !(key === "page" && value === 1)) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

const form = (id: string, path = "") => `/discovery/forms/${id}/${path}`;

export const listForms = (q: FormListQuery = {}) =>
  api<FormListPage>(`/discovery/forms/${query({ status: q.status, brand: q.brand, search: q.search?.trim(), ordering: q.ordering, page: q.page })}`);

export const listLibrary = (q: LibraryQuery = {}) =>
  api<LibraryPage>(
    `/discovery/library/${query({ search: q.search?.trim(), category: q.category, type: q.type, page: q.page, page_size: q.pageSize })}`
  );

export const listTemplates = () => api<TemplateWithPreview[]>("/discovery/templates/");

export const createForm = (body: NewForm) => api<DiscoveryForm>("/discovery/forms/", { method: "POST", body });

export const getForm = (id: string) => api<DiscoveryForm>(form(id));

export const updateForm = (id: string, body: FormPatch) => api<DiscoveryForm>(form(id), { method: "PATCH", body });

export const deleteForm = (id: string) => api<void>(form(id), { method: "DELETE" });

export const duplicateForm = (id: string) => api<DiscoveryForm>(form(id, "duplicate/"), { method: "POST" });

export const addSection = (id: string, title: LocalizedText) => api<DiscoveryForm>(form(id, "sections/"), { method: "POST", body: { title } });

export const renameSection = (id: string, sectionId: string, title: LocalizedText) =>
  api<DiscoveryForm>(form(id, `sections/${sectionId}/`), { method: "PATCH", body: { title } });

export const deleteSection = (id: string, sectionId: string) => api<DiscoveryForm>(form(id, `sections/${sectionId}/`), { method: "DELETE" });

export const reorderSections = (id: string, ids: string[]) =>
  api<DiscoveryForm>(form(id, "sections/reorder/"), { method: "POST", body: { ids } });

export const addQuestion = (id: string, body: QuestionDraft) => api<DiscoveryForm>(form(id, "questions/"), { method: "POST", body });

export const updateQuestion = (id: string, questionId: string, body: QuestionDraft) =>
  api<DiscoveryForm>(form(id, `questions/${questionId}/`), { method: "PATCH", body });

export const deleteQuestion = (id: string, questionId: string) =>
  api<DiscoveryForm>(form(id, `questions/${questionId}/`), { method: "DELETE" });

export const duplicateQuestion = (id: string, questionId: string) =>
  api<DiscoveryForm>(form(id, `questions/${questionId}/duplicate/`), { method: "POST" });

export const reorderQuestions = (id: string, items: { id: string; sectionId: string }[]) =>
  api<DiscoveryForm>(form(id, "questions/reorder/"), { method: "POST", body: { items } });

export const sendForm = (id: string, body: { recipientName?: string; recipientEmail?: string; settings?: FormPatch["settings"] }) =>
  api<DiscoveryForm>(form(id, "send/"), { method: "POST", body });

export const changeLink = (id: string, action: "revoke" | "regenerate") =>
  api<DiscoveryForm>(form(id, "link/"), { method: "POST", body: { action } });

export const reopenForm = (id: string) => api<DiscoveryForm>(form(id, "reopen/"), { method: "POST" });

export const getResponses = (id: string) => api<ResponsesView>(form(id, "responses/"));
