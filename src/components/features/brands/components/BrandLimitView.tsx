import { Button, EmptyState } from "@/components/ui";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/** Shown instead of the new-brand form when the account owns as many brands as its plan allows. */
export function BrandLimitView({ title, description }: { title: string; description: string }) {
  const { isAr } = useInterfaceLang();
  return (
    <div className="grid min-h-screen place-items-center px-space-6">
      <div className="w-full max-w-105">
        <EmptyState
          icon="lock"
          title={title}
          description={description}
          action={
            <Button variant="outline" href="/brands">
              {isAr ? "العودة إلى علاماتك" : "Back to your brands"}
            </Button>
          }
        />
      </div>
    </div>
  );
}
