import { notFound } from "next/navigation";
import { ControlsGallery } from "@/features/design-system";

// A development page: only built into a deploy that asks for it.
export default function ControlsPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <ControlsGallery />;
}
