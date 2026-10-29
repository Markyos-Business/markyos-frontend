import { Suspense } from "react";
import { notFound } from "next/navigation";
import { StyleGuide } from "@/components/features/design-system";

// A development page: only built into a deploy that asks for it.
export default function ComponentsPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  // The filter demo reads the URL's search params.
  return (
    <Suspense>
      <StyleGuide />
    </Suspense>
  );
}
