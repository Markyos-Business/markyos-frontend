import { Icon } from "@/components/ui";

/** The file being read, and which step the reader is on. */
export function ImportProgress({ fileName, progress }: { fileName: string; progress: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="grid size-control place-items-center rounded-lg bg-accent-soft">
        <Icon name="circle-notch" size={22} className="animate-spin text-accent-text" />
      </div>
      <div>
        <div className="mb-1 text-h5 font-medium">{fileName}</div>
        <div className="text-body text-text-muted">{progress}</div>
      </div>
    </div>
  );
}
