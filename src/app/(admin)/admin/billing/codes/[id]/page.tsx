import { Suspense } from "react";
import { CodeDetailView } from "@/features/admin";

/** One promo code, for a platform admin. */
export default async function AdminPromoCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <CodeDetailView id={id} />
    </Suspense>
  );
}
