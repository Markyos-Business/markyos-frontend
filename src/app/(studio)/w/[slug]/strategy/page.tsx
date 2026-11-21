import { redirect } from "next/navigation";
import { isStrategyTab, strategySectionHref } from "@/features/strategy";

/**
 * Every Strategy section has its own address since 22 Nov 2026
 * (/w/<slug>/strategy/<section>). The bare page, and the old `?tab=` links,
 * land on the section they meant, or on the first one.
 */
export default async function StrategyRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const wanted = Array.isArray(tab) ? tab[0] : tab;
  redirect(strategySectionHref(slug, isStrategyTab(wanted) ? wanted : "purpose"));
}
