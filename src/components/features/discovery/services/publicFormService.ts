import { api } from "@/lib/api/client";
import type { Lang } from "@/types";
import type { AnswerValue, PublicForm, PublicResponse, UploadedFile } from "../types";

// The client's side: no account, only the link's token and, once something is
// saved, the resume token that ties this browser to its response.

const base = (token: string, path = "") => `/public/forms/${encodeURIComponent(token)}/${path}`;

export const getPublicForm = (token: string, resumeToken: string | null) =>
  api<{ form: PublicForm; response: PublicResponse | null }>(base(token), {
    headers: resumeToken ? { "X-Resume-Token": resumeToken } : undefined,
  });

export const savePublicAnswers = (token: string, body: { answers: Record<string, AnswerValue>; resumeToken: string | null; language: Lang }) =>
  api<{ resumeToken: string; savedAt: string; status: string }>(base(token, "answers/"), { method: "POST", body });

export const uploadPublicFile = (token: string, questionId: string, file: File, resumeToken: string | null, language: Lang) => {
  const body = new FormData();
  body.append("file", file);
  body.append("questionId", questionId);
  body.append("language", language);
  if (resumeToken) body.append("resumeToken", resumeToken);
  return api<UploadedFile & { resumeToken: string }>(base(token, "files/"), { method: "POST", body });
};

export const submitPublicForm = (token: string, resumeToken: string | null) =>
  api<{ status: string; submittedAt: string }>(base(token, "submit/"), { method: "POST", body: { resumeToken } });
