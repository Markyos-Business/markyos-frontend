"use client";

import type { ReactNode } from "react";
import { Button } from "../button/button";
import { EmptyState } from "../empty-state/empty-state";
import { Icon } from "../icon";
import { FadeIn } from "../motion/fade-in";
import type { AsyncStatus } from "./async-status";
import { useUiStrings } from "../ui-strings";

type AsyncStateViewProps = {
  status: AsyncStatus;
  /** For `loading`: a skeleton shaped like the content, so nothing shifts when it arrives. */
  skeleton: ReactNode;
  /** Already in words a person can act on; never a raw error. */
  errorMessage?: string;
  /** Re-runs the load. Without it there is no Retry button. */
  onRetry?: () => void;
  emptyIcon?: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Under the empty message, e.g. an "Add brand" button. */
  emptyAction?: ReactNode;
  /** For `success`. */
  children: ReactNode;
};

/**
 * The four states of anything that loads: a skeleton, an error with Retry, an
 * empty state, the content. It loads nothing itself; derive `status` with
 * `getAsyncStatus` from the hook that does. The content fades in as it
 * replaces the skeleton.
 */
const AsyncStateView = ({
  status,
  skeleton,
  errorMessage,
  onRetry,
  emptyIcon = "inbox",
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: AsyncStateViewProps) => {
  const { t } = useUiStrings();
  if (status === "loading") return <>{skeleton}</>;
  // Whatever replaces the skeleton crossfades in rather than popping.
  if (status === "error") {
    return (
      <FadeIn variant="in">
      <EmptyState
        icon="exclamation-circle"
        title={t.errorTitle}
        description={errorMessage || t.tryAgain}
        action={
          onRetry && (
            <Button variant="outline" size="sm" icon={<Icon name="sync" size={18} />} onClick={onRetry}>
              {t.retry}
            </Button>
          )
        }
      />
      </FadeIn>
    );
  }
  if (status === "empty") {
    return (
      <FadeIn variant="in">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </FadeIn>
    );
  }
  return <FadeIn variant="in">{children}</FadeIn>;
};

export { AsyncStateView };
export type { AsyncStateViewProps };
