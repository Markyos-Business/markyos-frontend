import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import { InputField } from "@/components/form";
import { slugify } from "@/lib/utils";

type ScratchFormProps = {
  title: string;
  description: string;
  name: string;
  onName: (name: string) => void;
  onSubmit: (e: FormEvent) => void;
};

/** A new, empty brand: just its name. */
export function ScratchForm({ title, description, name, onName, onSubmit }: ScratchFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <h1 className="mb-space-3 text-h1 font-medium">{title}</h1>
      <p className="mb-[26px] text-body text-text-muted">{description}</p>
      <div className="mb-[26px]">
        <InputField
          // The <h1> asks for it, but a heading is not a label — this is
          // the only field on the screen and it still needs a name.
          aria-label="Brand name"
          placeholder="Nadeen Studio"
          value={name}
          onChange={(e) => onName(e.target.value)}
          autoFocus
          hint={`markyos.com/${slugify(name || "your-brand")}`}
        />
      </div>
      <Button type="submit" variant="primary" disabled={!name.trim()}>
        Create workspace
      </Button>
    </form>
  );
}
