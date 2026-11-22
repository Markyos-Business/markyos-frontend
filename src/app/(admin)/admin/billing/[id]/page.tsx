import { Suspense } from "react";
import { CheckoutDetailView } from "@/features/admin";

/** One checkout, for a platform admin. */
export default async function AdminCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <CheckoutDetailView id={id} />
    </Suspense>
  );
}
