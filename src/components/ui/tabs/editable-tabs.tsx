"use client";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DndContextProps } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { forwardRef, useId, useRef, useState } from "react";
import { Icon, } from "../icon";
import { IconButton } from "../button";
import { TabsRoot, type TabsRootProps } from "./tabs";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { TabsContent } from "./tabs-content";
import type { TabData } from "./tabs-context";
import { tabButtonId } from "./tab-navigation";
export interface EditableTabsProps extends Omit<TabsRootProps, "children" | "items"> {
  items: readonly TabData[]; onItemsChange: (items: TabData[]) => void;
  accessibility?: DndContextProps["accessibility"];
  onAdd?: () => void; label?: string; addLabel?: string; closeLabel?: string; dragLabel?: string;
  reorderedLabel?: (label: string, position: number, total: number) => string;
}
function SortableTab({ item, index, total, close, move, closeLabel, dragLabel }: { item: TabData; index: number; total: number; close: () => void; move: (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => void; closeLabel: string; dragLabel: string; }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: item.id, disabled: item.disabled });
  return <div ref={setNodeRef} data-dragging={isDragging || undefined} className="mk-editable-tab relative inline-flex shrink-0 items-stretch rounded-lg data-[dragging]:bg-accent-soft data-[dragging]:z-10" style={{ transform: CSS.Transform.toString(transform) }}>
    <button {...attributes} {...listeners} tabIndex={-1} type="button" aria-label={`${dragLabel}: ${item.label}`} className="inline-flex min-w-6 cursor-grab touch-none items-center justify-center text-text-muted"><Icon name="grip-vertical" size={16} /></button>
    <TabsTrigger value={item.id} icon={item.icon} count={item.count} unsaved={item.unsaved} status={item.status} countLabel={item.countLabel} unreadLabel={item.unreadLabel} unsavedLabel={item.unsavedLabel} errorLabel={item.errorLabel} warningLabel={item.warningLabel} successLabel={item.successLabel} positionLabel={item.positionLabel} disabled={item.disabled} disabledReason={item.disabledReason} closable={item.closable !== false} onClose={close} closeLabel={`${closeLabel}: ${item.label}`} position={index + 1} total={total} onKeyDown={event => move(event, index)}>{item.label}</TabsTrigger>
  </div>;
}
export const EditableTabs = forwardRef<HTMLDivElement, EditableTabsProps>(function EditableTabs({ items, onItemsChange, onAdd, accessibility, label = "Open files", addLabel = "Add tab", closeLabel = "Close tab", dragLabel = "Drag tab", reorderedLabel = (name, position, total) => `${name} moved to ${position} of ${total}`, value, defaultValue, onValueChange, ...props }, ref) {
  const generated = useId(); const id = props.id ?? generated;
  const [local, setLocal] = useState(defaultValue ?? items[0]?.id ?? "");
  const selected = value ?? local;
  const active = items.some(item => item.id === selected) ? selected : items.find(item => !item.disabled && !item.disabledReason)?.id ?? "";
  const [announcement, setAnnouncement] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  function reorder(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    onItemsChange(arrayMove([...items], from, to));
    setAnnouncement(reorderedLabel(items[from].label, to + 1, items.length));
  }
  function close(index: number) {
    const item = items[index];
    const remaining = items.filter(tab => tab.id !== item.id);
    const next = remaining.slice(index).find(tab => !tab.disabled && !tab.disabledReason) ?? [...remaining.slice(0, index)].reverse().find(tab => !tab.disabled && !tab.disabledReason);
    // Selecting the replacement also goes through the unsaved-change guard.
    void (async () => {
      if (active === item.id && props.onBeforeChange && !(await props.onBeforeChange(next?.id ?? "", active))) return;
      onItemsChange(remaining);
      if (active === item.id) { setLocal(next?.id ?? ""); onValueChange?.(next?.id ?? ""); }
      requestAnimationFrame(() => {
        const target = next ? document.getElementById(tabButtonId(id, next.id)) : container.current?.querySelector<HTMLButtonElement>('[data-add-tab]');
        target?.focus();
      });
    })().catch(() => undefined);
  }
  return <TabsRoot {...props} id={id} ref={node => { container.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }} value={active} onValueChange={next => { setLocal(next); onValueChange?.(next); }}>
    <DndContext accessibility={accessibility} sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active: dragged, over }) => { if (over) reorder(items.findIndex(item => item.id === dragged.id), items.findIndex(item => item.id === over.id)); }}>
      <SortableContext items={items.map(item => item.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex min-w-0 items-center"><div className="min-w-0 flex-1"><TabsList label={label}>{items.map((item, index) => <SortableTab key={item.id} item={item} index={index} total={items.length} close={() => close(index)} closeLabel={closeLabel} dragLabel={dragLabel} move={(event, from) => {
          if (!event.altKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
          const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
          reorder(from, from + step);
        }} />)}</TabsList></div>{onAdd && <IconButton data-add-tab icon="plus" label={addLabel} onClick={onAdd} />}</div>
      </SortableContext>
    </DndContext>
    {items.map(item => <TabsContent key={item.id} value={item.id} load={item.load}>{item.content}</TabsContent>)}
    <span role="status" className="sr-only">{announcement}</span>
  </TabsRoot>;
});
