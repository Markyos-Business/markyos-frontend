"use client";
import { Children, useId, useState, type ReactNode } from "react";
import { Button } from "../button/button";
import { Icon } from "../icon";
import { Popup } from "../popup";
import { useUiStrings } from "../ui-strings";
export type FilterBarProps = {
  search?: ReactNode; children?: ReactNode; active?: boolean; onClear?: () => void;
  /** Active advanced controls; count a date range once and exclude search. */
  filterCount?: number; label?: string; className?: string;
};
/** Stable search hierarchy, aligned desktop controls and a dedicated phone filter sheet. */
export function FilterBar({ search, children, active = false, onClear, filterCount = 0, label, className = "" }: FilterBarProps) {
  const { t, isAr } = useUiStrings(); const [open, setOpen] = useState(false); const panelId = useId();
  const filters = Children.toArray(children);
  const columns = ["", "xl:grid-cols-1", "xl:grid-cols-2", "xl:grid-cols-3", "xl:grid-cols-4", "xl:grid-cols-5"][Math.min(filters.length, 5)];
  const title = label ?? t.form.filters;
  const clear = active && onClear ? <Button variant="link" size="sm" icon={<Icon name="times" size={16} />} onClick={onClear}>{t.clearFilters}</Button> : null;
  return <div role="search" aria-label={title} data-filter-bar className={`flex min-w-0 flex-col gap-space-3 ${className}`}>
    <div className="flex min-w-0 flex-wrap items-center gap-space-3">
      {search && <div className="min-w-0 flex-1 [&>label]:h-control-sm [&>label]:w-full">{search}</div>}
      {!!filters.length && <Button variant={filterCount ? "ghost" : "outline"} size="lg" icon={<Icon name="filter" size={18} />} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen(true)} className="shrink-0 sm:hidden">
        {title}{filterCount > 0 && <span className="rounded-md bg-accent-soft px-space-2 text-caption tabular-nums">{filterCount}</span>}
      </Button>}
      <div className="hidden shrink-0 sm:block">{clear}</div>
    </div>
    {!!filters.length && <div data-filter-controls className={`hidden min-w-0 grid-cols-2 gap-space-3 sm:grid ${columns} [&>:last-child:nth-child(odd)]:col-span-2 xl:[&>:last-child:nth-child(odd)]:col-span-1`}>
      {filters.map((control,index) => <div key={index} className="min-w-0 [&>*]:w-full [&_[role=combobox]]:w-full [&_[role=combobox]]:max-w-none">{control}</div>)}
    </div>}
    {clear && <div className="sm:hidden">{clear}</div>}
    <Popup id={panelId} open={open} onOpenChange={setOpen} title={title} description={<span role="status">{t.form.activeFilters(filterCount)}</span>} variant="sheet" size="sm" dir={isAr ? "rtl" : "ltr"}
      footer={<>{onClear && <Button variant="outline" disabled={!active} onClick={onClear}>{t.clearFilters}</Button>}<Button onClick={() => setOpen(false)}>{t.showResults}</Button></>}>
      <div data-filter-panel data-expanded="true" className="group/filter-panel flex min-w-0 flex-col gap-space-6">{filters.map((control,index) => <div key={index} className="min-w-0 [&>*]:w-full [&_[role=combobox]]:w-full [&_[role=combobox]]:max-w-none">{control}</div>)}</div>
    </Popup>
  </div>;
}
