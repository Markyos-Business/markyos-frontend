import { api } from "@/lib/api/client";
import type { OverviewData } from "../types";

/** The whole Overview in one read, worked out and role-filtered by the server. */
export const getOverview = (brandId: string) => api<OverviewData>(`/brands/${encodeURIComponent(brandId)}/overview/`);
