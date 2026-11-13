import { notFound } from "next/navigation";
import { FormsGallery } from "@/components/features/design-system";

// A development page: only built into a deploy that asks for it.
export default function FormsGalleryPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <FormsGallery />;
}
