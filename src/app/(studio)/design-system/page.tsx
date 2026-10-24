import { notFound } from "next/navigation";
import { UiGallery } from "@/components/features/design-system";

// A development page: only built into a deploy that asks for it.
export default function DesignSystemPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <UiGallery />;
}
