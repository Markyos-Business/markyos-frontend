"use client";

import { RichTextEditor, richToPlainText, type RichTextEditorProps } from "../rich-text/rich-text";
import { useUiStrings } from "../ui-strings";
import { Field, type FieldState } from "./field";

type RichTextFieldProps = FieldState & {
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
  /** `article` adds a second heading level, images and dividers. */
  tools?: RichTextEditorProps["tools"];
  /** With `article` tools: opens the page's image picker. */
  onInsertImage?: RichTextEditorProps["onInsertImage"];
};

/**
 * Formatted text: bold, italic, headings, lists, quotes, links and tables
 * (plus a second heading level, images and dividers with `tools="article"`), with the
 * kit's own editor. Each paragraph takes its own direction, so Arabic and
 * English can sit in one value. Counts text, not tags. Controlled.
 */
const RichTextField = ({ label, info, value, onChange, onBlur, placeholder, maxLength, minHeight, className = "", tools, onInsertImage, ...state }: RichTextFieldProps) => {
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
        // The editor is a field; an error turns its underline danger
        // (aria-invalid on the text, `.mk-field:has([aria-invalid])`).
        <div aria-busy={control["aria-busy"]}>
          <RichTextEditor
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            isAr={isAr}
            minHeight={minHeight}
            maxLength={maxLength}
            tools={tools}
            onInsertImage={onInsertImage}
            disabled={control.disabled}
            readOnly={control.readOnly}
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
