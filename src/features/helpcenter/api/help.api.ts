import { api } from "@/lib/api/client";
import type { HelpCategory, HelpCategoryInput } from "../types";

export const listHelpCategories = () => api<HelpCategory[]>("/help/admin/categories/");

export const saveHelpCategory = ({ id, ...body }: HelpCategoryInput) =>
  id
    ? api<HelpCategory>(`/help/admin/categories/${id}/`, { method: "PATCH", body })
    : api<HelpCategory>("/help/admin/categories/", { method: "POST", body });

export const deleteHelpCategory = (id: number) => api<void>(`/help/admin/categories/${id}/`, { method: "DELETE" });

/** One level's new order: every sibling id once. */
export const reorderHelpCategories = (parent: number | null, ids: number[]) =>
  api<HelpCategory[]>("/help/admin/categories/reorder/", { method: "POST", body: { parent, ids } });
