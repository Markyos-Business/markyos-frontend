import { PageTransition } from "@/components/ui";

// Each page in this area arrives with a fade-up; the layout above stays put.
export default function Template({ children }: LayoutProps<"/">) {
  return <PageTransition>{children}</PageTransition>;
}
