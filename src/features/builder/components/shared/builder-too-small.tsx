import { Button, EmptyState } from "@/components/ui";
import type { Workspace } from "@/types";
import { builderCopy } from "../../copy";

/** Under 768px: what the builder needs, and the two ways on from here. */
export function BuilderTooSmall({ ws, isAr, previewHref }: { ws: Workspace; isAr: boolean; previewHref: string }) {
  const c = builderCopy(isAr).layout.tooSmall;
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-space-8">
      <EmptyState
        icon="desktop"
        titleAs="h1"
        title={c.title}
        description={c.body}
        action={
          <div className="flex flex-wrap justify-center gap-ctl-row">
            <Button variant="primary" size="md" href={`${previewHref}?preview=1`}>{c.view}</Button>
            <Button variant="outline" size="md" href={`/w/${ws.slug}/overview`}>{c.back}</Button>
          </div>
        }
      />
    </div>
  );
}
