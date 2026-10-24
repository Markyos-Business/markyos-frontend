"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";

type UseFileDropOptions = {
  /** Called with the dropped files, never an empty list. */
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

/**
 * Drag-and-drop for a file drop target. Spread `dropHandlers` onto the target
 * and style it from `isDragging`. Counts enters and leaves so moving over the
 * target's own children doesn't make the highlight flicker off and on.
 */
const useFileDrop = ({ onFiles, disabled = false }: UseFileDropOptions) => {
  const depth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    depth.current++;
    setIsDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setIsDragging(false);
  };
  const onDragOver = (e: DragEvent) => e.preventDefault();
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setIsDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) onFiles(files);
  };

  return { isDragging, dropHandlers: { onDragEnter, onDragLeave, onDragOver, onDrop } };
};

export { useFileDrop };
export type { UseFileDropOptions };
