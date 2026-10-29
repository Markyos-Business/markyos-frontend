"use client";

import { Button } from "../buttons/Button";
import { IconBadge } from "../badges/IconBadge";
import { Icon } from "../primitives/Icon";
import { useUiStrings } from "../i18n/uiStrings";

type ErrorStateProps = {
  /** Default: the kit's "Something went wrong". */
  title?: string;
  /** What failed, in words a person can act on. Default: the kit's generic line. */
  message?: string;
  /** Re-runs the load. Without it there is no Retry button. */
  onRetry?: () => void;
  className?: string;
};

/** A load that failed: what happened, and a way to try again. Announced as an alert. */
const ErrorState = ({ title, message, onRetry, className = "" }: ErrorStateProps) => {
  const { t } = useUiStrings();
  return (
    <div role="alert" className={`flex flex-col items-center gap-space-3 px-space-6 py-space-11 text-center ${className}`}>
      <IconBadge icon="exclamation-circle" tone="danger" />
      <p className="text-body font-medium text-text">{title ?? t.errorTitle}</p>
      <p dir="auto" className="bidi-auto text-caption text-text-muted">
        {message ?? t.errorBody}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-space-3" icon={<Icon name="sync" size={18} />} onClick={onRetry}>
          {t.retry}
        </Button>
      )}
    </div>
  );
};

export { ErrorState };
export type { ErrorStateProps };
