import { useUiStrings } from "../i18n";
import { Icon } from "../primitives/Icon";

type TablePaginationProps = {
  /** 1-based. */
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  /** Rows on this page. */
  itemCount: number;
  /** Rows across every page, as the server reports it. */
  totalCount: number;
  /** What a row is, plural: "users", "brands". */
  itemLabel: string;
  loading?: boolean;
};

/** The pages to show: the first, the last, and the current one with its neighbours; `null` is a gap. */
const pageWindow = (current: number, pages: number): (number | null)[] => {
  const keep = new Set([1, pages, current - 1, current, current + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
};

// PREV / NEXT: the spec's link button (§6.4), an overline with an 18px arrow.
const linkButton =
  "inline-flex h-control-sm items-center gap-space-3 px-space-3 text-overline uppercase text-text-muted transition-colors not-disabled:hover:text-accent-text disabled:text-text-disabled";

/**
 * "Showing 1 to 25 of 62 users", then the spec's pagination (§6.12): 40px
 * cells with a 6px radius, the current one solid accent, between PREV and
 * NEXT. The arrows point the way the pages turn, so they swap sides in Arabic.
 */
const TablePagination = ({
  currentPage,
  onPageChange,
  itemsPerPage,
  itemCount,
  totalCount,
  itemLabel,
  loading = false,
}: TablePaginationProps) => {
  // A short last page is the end, whatever the stale total says.
  const total = itemCount < itemsPerPage ? (currentPage - 1) * itemsPerPage + itemCount : totalCount;
  const pages = Math.max(Math.ceil(total / itemsPerPage), 1);
  const first = (currentPage - 1) * itemsPerPage + 1;
  const last = (currentPage - 1) * itemsPerPage + itemCount;
  const { t } = useUiStrings();

  return (
    <nav
      aria-label={t.pagesOf(itemLabel)}
      className="flex flex-col items-center justify-between gap-space-4 px-space-8 py-space-6 text-caption text-text-muted shadow-rule-t sm:flex-row"
    >
      {itemCount === 0 && !loading ? (
        <span />
      ) : (
        <span>
          {/* Words and numbers alternate; the numbers stand out. */}
          {t.showing(first, last, total, itemLabel).map((part, i) =>
            typeof part === "number" ? (
              <span key={i} className="font-medium text-text-secondary">
                {part}
              </span>
            ) : (
              part
            )
          )}
        </span>
      )}
      <div className="flex items-center gap-space-1">
        <button
          type="button"
          className={linkButton}
          disabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        >
          <Icon name="arrow-left" size={18} className="rtl:-scale-x-100" />
          {t.prev}
        </button>
        {pageWindow(currentPage, pages).map((page, i) =>
          page === null ? (
            <span key={`gap-${i}`} aria-hidden className="w-6 text-center">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              aria-label={t.page(page)}
              aria-current={page === currentPage ? "page" : undefined}
              disabled={loading}
              onClick={() => onPageChange(page)}
              className={`mk-btn flex size-control-sm items-center justify-center rounded-md text-body font-medium tabular-nums ${
                page === currentPage ? "bg-accent text-accent-ink" : "text-text-muted"
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          className={linkButton}
          disabled={currentPage >= pages || loading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t.next}
          <Icon name="arrow-right" size={18} className="rtl:-scale-x-100" />
        </button>
      </div>
    </nav>
  );
};

export { TablePagination };
export type { TablePaginationProps };
