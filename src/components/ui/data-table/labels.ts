import type { TableLabels } from "./types";
export const tableLabels: TableLabels = {
  search: "Search rows", filters: "Filters", clearFilters: "Clear filters", columns: "Columns", density: "Density", compact: "Compact", comfortable: "Comfortable",
  retry: "Retry", error: "These rows could not be loaded.", empty: "There are no assets to display.", noPermission: "You don't have access to these assets.", stale: "Showing saved data. Reconnect to refresh.",
  loadMore: "Load more", loadingMore: "Loading more rows…", noResults: q => `No assets match “${q}”.`, selected: n => `${n} selected`, results: n => `${n} results loaded`,
  selectAll: "Select all rows on this page", selectRow: label => `Select ${label}`, selectAllMatching: n => `Select all ${n}`, clearSelection: "Clear selection",
  actions: label => `Actions for ${label}`, expand: label => `Expand ${label}`, collapse: label => `Collapse ${label}`, groupCount: n => `${n} rows`,
  save: "Save", cancel: "Cancel", edit: label => `Edit ${label}`, saving: "Saving…", saved: "Saved", failed: "This row could not be saved.", moveRow: "Reorder row",
  moveEarlier: label => `Move ${label} earlier`, moveLater: label => `Move ${label} later`, resize: label => `Resize ${label}`, pageSize: "Rows per page", range: (a, b, n) => `${a}–${b} of ${n}`,
};
