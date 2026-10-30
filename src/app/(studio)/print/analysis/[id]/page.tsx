import { PrintReportView } from "@/components/features/briefs";

/** A brief analysis laid out for paper; the browser's print dialog saves the PDF. */
export default async function PrintAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrintReportView id={id} />;
}
