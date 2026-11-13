"use client";

import { RichTextEditor, richToPlainText } from "../../ui/composites/RichText";
import { useUiStrings } from "../../ui/i18n/uiStrings";
import { Field, type FieldState } from "../field/Field";

type RichTextFieldProps = Omit<FieldState, "readOnly"> & {
  label: string;
  info?: string;
  /** HTML from the editor. */
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Count characters of text (not markup) against this. */
  maxLength?: number;
  minHeight?: number;
  className?: string;
};

/**
 * Formatted text: bold, italic, headings, lists, quotes and links, with the
 * kit's own editor. Each paragraph takes its own direction, so Arabic and
 * English can sit in one value. Counts text, not tags. Controlled.
 */
const RichTextField = ({ label, info, value, onChange, onBlur, placeholder, maxLength, minHeight, className = "", ...state }: RichTextFieldProps) => {
  const { isAr } = useUiStrings();
  const length = richToPlainText(value).length;
  return (
    <Field
      bare
      label={label}
      info={info}
      {...state}
      count={maxLength ? { current: length, max: maxLength } : undefined}
      className={className}
    >
      {(control) => (
        // The editor draws its own frame; an error rings it.
        <div
          aria-busy={control["aria-busy"]}
          data-state={control["aria-invalid"] ? "error" : undefined}
          className="rounded-lg data-[state=error]:outline-1 data-[state=error]:outline-danger"
        >
          <RichTextEditor
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            isAr={isAr}
            minHeight={minHeight}
            editorProps={{
              id: control.id,
              "aria-labelledby": `${control.id}-label`,
              "aria-describedby": control["aria-describedby"],
              "aria-invalid": control["aria-invalid"],
              "aria-required": control["aria-required"],
            }}
          />
        </div>
      )}
    </Field>
  );
};

export { RichTextField };
export type { RichTextFieldProps };
