import { api } from "@/lib/api/client";
import type { BriefAnalysis, Comparison, Overview, Section, SectionKey } from "../types";

const analysis = (id: string, path = "") => `/briefs/${id}/${path}`;

export const getOverview = (brand: string) => api<Overview>(`/briefs/?brand=${encodeURIComponent(brand)}`);

export const startAnalysis = (brandId: string, language: "en" | "ar", confirmCost: boolean) =>
  api<BriefAnalysis>("/briefs/", { method: "POST", body: { brandId, language, confirmCost } });

export const getAnalysis = (id: string) => api<BriefAnalysis>(analysis(id));

export const compareVersions = (id: string, otherId: string) => api<Comparison>(analysis(id, `compare/${otherId}/`));

export const editSection = (id: string, key: SectionKey, content: unknown) =>
  api<Section>(analysis(id, `sections/${key}/`), { method: "PATCH", body: { content } });

export const resetSection = (id: string, key: SectionKey) => api<Section>(analysis(id, `sections/${key}/reset/`), { method: "POST" });

export const regenerateSection = (id: string, key: SectionKey, instruction: string, confirmCost: boolean) =>
  api<Section>(analysis(id, `sections/${key}/regenerate/`), { method: "POST", body: { instruction, confirmCost } });

/** The exact answer a citation names, from the form's responses. */
export const getFormAnswer = async (formId: string, questionId: string) => {
  const view = await api<{
    sections: { questions: { id: string; title: { en: string | null; ar: string | null }; answer: { value: unknown; answeredLanguage: "en" | "ar" } | null }[] }[];
  }>(`/discovery/forms/${formId}/responses/`);
  for (const section of view.sections) {
    const question = section.questions.find((q) => q.id === questionId);
    if (question) return question;
  }
  return null;
};
