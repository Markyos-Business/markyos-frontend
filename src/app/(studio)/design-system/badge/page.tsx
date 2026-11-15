import { notFound } from "next/navigation";
import { BadgeGallery } from "@/features/design-system";

// A development page: only built into a deploy that asks for it.
export default function BadgeGalleryPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <BadgeGallery />;
}
