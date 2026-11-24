"use client";

import { useState } from "react";
import {
  CheckboxGroup,
  CurrencyField,
  DatePicker,
  FormDialog,
  NumberField,
  PercentageField,
  RadioField,
  SurfaceCard,
  TextareaField,
  ToggleField,
} from "@/components/ui";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import { PROMO_DURATIONS, usePlans, type PromoDuration } from "@/features/billing";
import type { AccountType } from "@/types";
import type { PromoActions } from "../../hooks/billing/use-promo-actions";
import { useAdminPromoLang } from "../../hooks/shared/use-admin-lang";
import { isoDay, REASON_MAX } from "../../utils/billing";
import {
  ALL_TYPES,
  COUNT_MAX,
  DEFAULT_GENERATE,
  MONTHS_MAX,
  PERCENT_MAX,
  previewLines,
  validateGenerate,
  type DiscountKind,
  type GenerateErrors,
  type GenerateForm,
} from "../../utils/promo";

/**
 * Generate a batch of codes (promo-codes-plan §1): how many, uses each, the
 * discount, how long it lasts, the last day to redeem, the account types,
 * first purchase only, and a note for the audit log. The preview prices come
 * from /billing/plans/ and are for the admin's eyes only; the server checks
 * every setting again and makes the codes.
 */
export function GenerateCodesDialog({ actions }: { actions: PromoActions }) {
  const { p, lang, isAr } = useAdminPromoLang();
  const f = p.form;
  const plans = usePlans();
  const [form, setForm] = useState<GenerateForm>(DEFAULT_GENERATE);
  const [errors, setErrors] = useState<GenerateErrors>({});
  const [today] = useState(() => new Date());
  const currency = (plans?.currency ?? "usd").toUpperCase();
  const typeLabel = (type: AccountType) => (isAr ? ACCOUNT_TYPES[type].arLabel : ACCOUNT_TYPES[type].label);

  const set = <K extends keyof GenerateForm>(key: K, value: GenerateForm[K], clears: keyof GenerateErrors = key as keyof GenerateErrors) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [clears]: undefined }));
  };
  const close = () => {
    actions.setGenerating(false);
    setForm(DEFAULT_GENERATE);
    setErrors({});
  };

  const e = f.errors;
  const discountError = errors.discount
    ? typeof errors.discount === "object"
      ? e.belowFloor(typeLabel(errors.discount.belowFloor))
      : errors.discount === "percent"
        ? e.percent
        : e.amount
    : undefined;
  const preview = plans ? previewLines(form, plans, lang, typeLabel) : [];

  return (
    <FormDialog
      open={actions.generating}
      title={f.title}
      description={f.description}
      submitLabel={f.submit}
      errorMessage={f.failed}
      onClose={close}
      onSubmit={async () => {
        const found = validateGenerate(form, new Date(), plans);
        setErrors(found);
        if (Object.values(found).some(Boolean)) return false;
        const failed = await actions.generate(form);
        if (typeof failed === "string") return failed;
        close();
      }}
    >
      <div className="grid gap-field-stack sm:grid-cols-2 sm:gap-x-form-col">
        <NumberField
          label={f.count}
          required
          value={form.count}
          onChange={(value) => set("count", value)}
          min={1}
          max={COUNT_MAX}
          hint={f.countHint}
          error={errors.count ? e.count : undefined}
        />
        <NumberField
          label={f.usesPerCode}
          optional
          value={form.usesPerCode}
          onChange={(value) => set("usesPerCode", value)}
          min={1}
          hint={f.usesHint}
          error={errors.usesPerCode ? e.uses : undefined}
        />
      </div>
      <RadioField
        label={f.kind}
        value={form.kind}
        onChange={(value) => set("kind", value as DiscountKind, "discount")}
        options={[
          { value: "percent", label: f.percent },
          { value: "amount", label: f.amount },
        ]}
      />
      {form.kind === "percent" ? (
        <PercentageField
          label={f.percentOff}
          required
          value={form.percentOff}
          onChange={(value) => set("percentOff", value, "discount")}
          min={1}
          max={PERCENT_MAX}
          hint={f.percentHint}
          error={discountError}
        />
      ) : (
        <CurrencyField
          label={f.amountOff}
          required
          currency={currency}
          value={form.amountOff}
          onChange={(value) => set("amountOff", value, "discount")}
          min={0}
          hint={f.amountHint}
          error={discountError}
        />
      )}
      <RadioField
        label={f.duration}
        orientation="vertical"
        value={form.duration}
        onChange={(value) => set("duration", value as PromoDuration, "months")}
        options={PROMO_DURATIONS.map((value) => ({ value, label: f.durations[value], description: f.durationHints[value] }))}
      />
      {form.duration === "repeating" && (
        <NumberField
          label={f.months}
          required
          value={form.months}
          onChange={(value) => set("months", value)}
          min={1}
          max={MONTHS_MAX}
          hint={f.monthsHint}
          error={errors.months ? e.months : undefined}
        />
      )}
      <DatePicker
        label={f.expires}
        optional
        value={form.expiresOn}
        onChange={(value) => set("expiresOn", value)}
        min={isoDay(today)}
        hint={f.expiresHint}
        error={errors.expiresOn ? e.expiresPast : undefined}
      />
      <CheckboxGroup
        label={f.types}
        orientation="horizontal"
        value={form.accountTypes}
        onChange={(value) => set("accountTypes", value as AccountType[], "discount")}
        options={ALL_TYPES.map((value) => ({ value, label: typeLabel(value) }))}
        hint={f.typesHint}
      />
      <ToggleField
        label={f.firstPurchase}
        checked={form.firstPurchaseOnly}
        onChange={(value) => set("firstPurchaseOnly", value)}
        description={{ on: f.firstPurchaseOn, off: f.firstPurchaseOff }}
      />
      <TextareaField
        label={f.note}
        required
        hint={f.noteHint}
        value={form.note}
        onChange={(event) => set("note", event.target.value)}
        maxLength={REASON_MAX}
        showCount
        rows={2}
        autoGrow
        maxRows={5}
        resizable={false}
        error={errors.note ? (errors.note === "required" ? e.noteRequired : e.noteTooLong) : undefined}
      />
      <SurfaceCard padding="sm" className="flex flex-col gap-space-2" data-promo-preview>
        <p className="text-label text-text-muted">{f.preview}</p>
        <div role="status" aria-live="polite" className="flex flex-col gap-space-1">
          {preview.length ? (
            preview.map((line) => (
              <p key={line} className="text-body tabular-nums text-text">
                {line}
              </p>
            ))
          ) : (
            <p className="text-body text-text-muted">{f.previewNone}</p>
          )}
        </div>
      </SurfaceCard>
    </FormDialog>
  );
}
