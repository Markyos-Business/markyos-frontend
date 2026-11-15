import { Suspense } from "react";
import { ArticlesView } from "@/features/content";

// The section shown comes from the address (?kind=).
export default function ContentPage() {
  return (
    <Suspense>
      <ArticlesView />
    </Suspense>
  );
}
