/** Whether `file` matches `accept`: extensions (".pdf"), MIME types or groups ("image/*"). */
const accepts = (file: File, accept: string | undefined) =>
  !accept ||
  accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) =>
      rule.startsWith(".")
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith("/*")
          ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
          : file.type.toLowerCase() === rule,
    );

/** "840 KB", "2.4 MB": Western digits, left to right, in either language. */
const fileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
};

type FileRejection = { file: File; reason: "type" | "size" | "count" };

/**
 * Sorts dropped or chosen files into the ones to take and the ones refused,
 * with why: the wrong type, too big, or past `maxFiles` (counting `already`).
 */
function sortFiles(files: readonly File[], { accept, maxBytes, maxFiles, already = 0 }: { accept?: string; maxBytes?: number; maxFiles?: number; already?: number }) {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  for (const file of files) {
    if (!accepts(file, accept)) rejected.push({ file, reason: "type" });
    else if (maxBytes !== undefined && file.size > maxBytes) rejected.push({ file, reason: "size" });
    else if (maxFiles !== undefined && already + accepted.length >= maxFiles) rejected.push({ file, reason: "count" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

export { accepts, fileSize, sortFiles };
export type { FileRejection };
