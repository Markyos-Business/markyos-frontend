import { Button, EmptyState } from "@/components/ui";

/** Shown instead of the new-brand form when the account owns as many brands as its plan allows. */
export function BrandLimitView({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-screen place-items-center px-space-6">
      <div className="w-full max-w-105">
        <EmptyState
          icon="lock"
          title={title}
          description={description}
          action={
            <Button variant="outline" href="/brands">
              Back to your brands
            </Button>
          }
        />
      </div>
    </div>
  );
}
