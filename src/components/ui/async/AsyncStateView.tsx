"use client";

import type { ReactNode } from "react";
import { Button } from "../buttons/Button";
import { EmptyState } from "../empty/EmptyState";
import { Icon } from "../primitives/Icon";
import type { AsyncStatus } from "./asyncStatus";

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
  if (status === "loading") return <>{skeleton}</>;
  if (status === "error") {
    return (
      <EmptyState
        icon="exclamation-circle"
        title="Something went wrong"
        description={errorMessage || "Please try again."}
        action={
          onRetry && (
            <Button variant="outline" size="sm" icon={<Icon name="sync" size={18} />} onClick={onRetry}>
              Retry
            </Button>
          )
        }
      />
    );
  }
  if (status === "empty") {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }
  return <>{children}</>;
};

export { AsyncStateView };
export type { AsyncStateViewProps };
