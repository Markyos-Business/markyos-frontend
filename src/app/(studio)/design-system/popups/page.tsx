import { notFound } from "next/navigation";
import { PopupGallery } from "@/features/design-system";
export default function PopupsPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <PopupGallery />;
}
