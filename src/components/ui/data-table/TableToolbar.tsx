"use client";
import { Button } from "../buttons/Button";
import { Popover } from "../overlays/Popover";
import { InputField } from "../../form/fields/InputField";
import { CheckboxField } from "../../form/fields/CheckboxField";
import { Select } from "../select/Select";
import { Icon } from "../primitives/Icon";
import type { DataTableProps } from "./types";
import type { DataTableModel } from "./useDataTable";
import { moveItem } from "./model";
export function TableToolbar<T>({ props, model }: { props: DataTableProps<T>; model: DataTableModel<T> }) {
  const { table, labels: l } = model;
  if (!props.filterable && !props.resizable && !props.reorderColumns && !props.columnControls && !props.densityControl) return null;
  return <div className="flex flex-wrap items-end gap-space-4 p-space-4 shadow-rule-b" role="group" aria-label={l.filters}>
    {props.filterable && <div className="min-w-0 flex-1"><InputField size="sm" label={l.search} value={model.search} onChange={e => table.setGlobalFilter(e.target.value)} type="search" /></div>}
    {props.filterable && <Popover label={`${l.filters} (${model.filters.length})`} trigger="pill" button={<>{l.filters} ({model.filters.length})</>}>
      {() => <div className="flex flex-col gap-space-4 p-space-4">{props.columns.filter(c => c.filterable).map(c => <div key={c.key}>{c.filterOptions ? <Select label={c.header} value={String(table.getColumn(c.key)?.getFilterValue() ?? "")} placeholder={c.header} options={c.filterOptions} onValueChange={value => table.getColumn(c.key)?.setFilterValue(value)} /> : <InputField size="sm" label={c.header} value={String(table.getColumn(c.key)?.getFilterValue() ?? "")} onChange={e => table.getColumn(c.key)?.setFilterValue(e.target.value)} />}</div>)}</div>}
    </Popover>}
    <Popover label={l.columns} trigger="pill" button={l.columns} width={300}>{() => <div className="flex flex-col gap-space-3 p-space-4">{table.getAllLeafColumns().map((column, index, columns) => <div key={column.id} className="flex items-center gap-space-2">
      <CheckboxField label={String(column.columnDef.header)} checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} disabled={column.getIsVisible() && table.getVisibleLeafColumns().length === 1} />
      {props.reorderColumns && <span className="ms-auto flex"><button type="button" className="mk-tap flex size-8 items-center justify-center" aria-label={l.moveEarlier(String(column.columnDef.header))} disabled={index === 0} onClick={() => table.setColumnOrder(moveItem(columns.map(c => c.id), index, index - 1))}><Icon name="arrow-left" size={16} /></button><button type="button" className="mk-tap flex size-8 items-center justify-center" aria-label={l.moveLater(String(column.columnDef.header))} disabled={index === columns.length - 1} onClick={() => table.setColumnOrder(moveItem(columns.map(c => c.id), index, index + 1))}><Icon name="arrow-right" size={16} /></button></span>}
    </div>)}</div>}</Popover>
    <Select label={l.density} aria-label={l.density} value={model.density} options={[{ value: "comfortable", label: l.comfortable }, { value: "compact", label: l.compact }]} onValueChange={value => model.setDensity(value as "comfortable" | "compact")} />
    {(model.search || model.filters.length > 0) && <div className="flex w-full flex-wrap gap-space-2">
      {model.filters.map(filter => <Button key={filter.id} size="xs" variant="soft" onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}>{props.columns.find(c => c.key === filter.id)?.header}: {String(filter.value)} <Icon name="times" size={16} /></Button>)}
      <Button size="xs" variant="outline" onClick={() => { table.resetColumnFilters(true); table.setGlobalFilter(""); }}>{l.clearFilters}</Button>
    </div>}
  </div>;
}
