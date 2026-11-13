"use client";

import { Button, Icon } from "@/components/ui";

/** The way from a form's answers to the brand's analysis. */
export function AnalysisLink({ href, isAr }: { href: string; isAr: boolean }) {
  return (
    <Button variant="outline" size="sm" href={href} icon={<Icon name="chart-line" size={16} />}>
      {isAr ? "التحليل" : "Analysis"}
    </Button>
  );
}
