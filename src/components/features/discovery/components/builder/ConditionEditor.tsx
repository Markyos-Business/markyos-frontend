"use client";

import { Button, Icon, IconButton } from "@/components/ui";
import { SegmentedToggle, SelectInput } from "@/components/form";
import { OPERATORS_FOR, OPERATOR_LABELS } from "../../constants";
import { textIn } from "../../model/questionTypes";
import type { Condition, FormQuestion, Visibility } from "../../types";

type ConditionEditorProps = {
  /** Only questions above this one: a condition may never point forward. */
  earlier: { question: FormQuestion; number: number }[];
  visibility: Visibility;
  onChange: (visibility: Visibility) => void;
  disabled: boolean;
  isAr: boolean;
};

const lang = (isAr: boolean) => (isAr ? "ar" : "en");

/** Show/hide: always, or only when earlier answers match. */
export function ConditionEditor({ earlier, visibility, onChange, disabled, isAr }: ConditionEditorProps) {
  // Only questions whose type has something to compare against.
  const targets = earlier.filter(({ question }) => OPERATORS_FOR[question.type].length > 0);
  const conditions = visibility?.conditions ?? [];
  const conditional = conditions.length > 0;

  const firstCondition = (): Condition | null => {
    const target = targets[targets.length - 1]?.question;
    if (!target) return null;
    const operator = OPERATORS_FOR[target.type][0];
    return { questionId: target.id, operator, value: defaultValue(target) };
  };

  const set = (next: Condition[], match = visibility?.match ?? "all") => onChange(next.length ? { match, conditions: next } : null);

  return (
    <div className="flex flex-col gap-space-5">
      <SegmentedToggle
        label={isAr ? "الظهور" : "Visibility"}
        off={{ label: isAr ? "يظهر دائمًا" : "Always show" }}
        on={{ label: isAr ? "يظهر بشرط" : "Show when…" }}
        value={conditional}
        onChange={(on) => {
          if (disabled) return;
          if (!on) return set([]);
          const c = firstCondition();
          if (c) set([c]);
        }}
      />
      {!conditional && targets.length === 0 && (
        <p className="text-caption text-text-muted">
          {isAr ? "يمكن ربط السؤال بإجابة سؤال يسبقه فقط." : "A question can only depend on an answer above it."}
        </p>
      )}
      {conditional && (
        <>
          {conditions.length > 1 && (
            <SelectInput
              aria-label={isAr ? "تطابق الشروط" : "Match"}
              value={visibility?.match ?? "all"}
              disabled={disabled}
              onChange={(e) => set(conditions, e.target.value as "all" | "any")}
              options={[
                { value: "all", label: isAr ? "عندما تتحقق كل الشروط" : "When all of these are true" },
                { value: "any", label: isAr ? "عندما يتحقق أي شرط" : "When any of these is true" },
              ]}
            />
          )}
          {conditions.map((condition, i) => {
            const target = targets.find((t) => t.question.id === condition.questionId)?.question;
            const replace = (patch: Partial<Condition>) => set(conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)));
            return (
              <div key={i} className="flex flex-col gap-space-3 rounded-lg bg-surface-sunken p-space-5 shadow-edge-soft">
                <div className="flex items-start gap-space-3">
                  <SelectInput
                    className="min-w-0 flex-1"
                    aria-label={isAr ? "السؤال" : "Question"}
                    value={condition.questionId}
                    disabled={disabled}
                    onChange={(e) => {
                      const next = targets.find((t) => t.question.id === e.target.value)!.question;
                      replace({ questionId: next.id, operator: OPERATORS_FOR[next.type][0], value: defaultValue(next) });
                    }}
                    options={targets.map(({ question, number }) => ({
                      value: question.id,
                      label: `${number}. ${textIn(question.title, lang(isAr)) || (isAr ? "سؤال بلا عنوان" : "Untitled question")}`,
                    }))}
                  />
                  <IconButton
                    icon="times"
                    label={isAr ? "حذف الشرط" : "Remove condition"}
                    disabled={disabled}
                    onClick={() => set(conditions.filter((_, j) => j !== i))}
                    className="text-text-muted disabled:text-text-disabled"
                  />
                </div>
                {target && (
                  <div className="grid grid-cols-2 gap-space-3">
                    <SelectInput
                      aria-label={isAr ? "المقارنة" : "Comparison"}
                      value={condition.operator}
                      disabled={disabled}
                      onChange={(e) => replace({ operator: e.target.value as Condition["operator"] })}
                      options={OPERATORS_FOR[target.type].map((op) => ({ value: op, label: OPERATOR_LABELS[op][lang(isAr)] }))}
                    />
                    <ValueInput question={target} value={condition.value} onChange={(value) => replace({ value })} disabled={disabled} isAr={isAr} />
                  </div>
                )}
              </div>
            );
          })}
          <div>
            <Button
              variant="link"
              disabled={disabled}
              onClick={() => {
                const c = firstCondition();
                if (c) set([...conditions, c]);
              }}
            >
              <Icon name="plus" size={16} />
              {isAr ? "إضافة شرط" : "Add condition"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

const defaultValue = (question: FormQuestion): string | number => {
  if (question.type === "scale") return question.config.max ?? 5;
  return question.config.options?.[0]?.value ?? "";
};

type ValueInputProps = { question: FormQuestion; value: string | number; onChange: (value: string | number) => void; disabled: boolean; isAr: boolean };

/** What the condition compares against: an option, a number, or some text. */
function ValueInput({ question, value, onChange, disabled, isAr }: ValueInputProps) {
  if (question.type === "scale") {
    const low = question.config.min ?? 1;
    const high = question.config.max ?? 5;
    return (
      <SelectInput
        aria-label={isAr ? "القيمة" : "Value"}
        value={String(value)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        options={Array.from({ length: high - low + 1 }, (_, i) => ({ value: String(low + i), label: String(low + i) }))}
      />
    );
  }
  if (question.type === "choice" || question.type === "image_choice") {
    return (
      <SelectInput
        aria-label={isAr ? "القيمة" : "Value"}
        value={String(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        options={(question.config.options ?? []).map((o) => ({ value: o.value, label: textIn(o.label, isAr ? "ar" : "en") || o.value }))}
      />
    );
  }
  return (
    <input
      aria-label={isAr ? "القيمة" : "Value"}
      dir="auto"
      defaultValue={String(value)}
      disabled={disabled}
      onBlur={(e) => e.target.value !== String(value) && onChange(e.target.value)}
      className="mk-underline w-full"
    />
  );
}
