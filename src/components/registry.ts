/** Public Wave 2 components; status is intentionally in-review until approved. */
export const componentRegistry = [
  { name: "DataTable", status: "in-review", wave: 2, file: "src/components/ui/data-table/DataTable.tsx", notes: "TanStack v8 pipeline; basic, selected, sorted, filtered, paged, infinite, nested/grouped, edited, sticky, resized/reordered, virtualized, media and mobile-card variants. Legacy table import remains compatible." },
  { name: "Select", status: "in-review", wave: 2, file: "src/components/ui/select/Select.tsx", notes: "Radix Select; grouped/rich options, validation, readonly and native-on-touch." },
  { name: "Combobox", status: "in-review", wave: 2, file: "src/components/ui/select/Combobox.tsx", notes: "Radix Popover + cmdk; searchable single and creatable." },
  { name: "MultiSelect", status: "in-review", wave: 2, file: "src/components/ui/select/MultiSelect.tsx", notes: "Removable chips, overflow, max selections and touch-native multiple selection." },
  { name: "AsyncSelect", status: "in-review", wave: 2, file: "src/components/ui/select/AsyncSelect.tsx", notes: "Debounced/abortable loading, stale-response protection, retry and selected-label cache." },
  { name: "NativeSelect", status: "in-review", wave: 2, file: "src/components/ui/select/NativeSelect.tsx", notes: "Semantic native select with the shared field shape and notes." },
  { name: "Progress", status: "in-review", wave: 2, file: "src/components/ui/loading/Progress.tsx", notes: "Determinate or indeterminate progress with accessible naming and reduced motion." },
] as const;
