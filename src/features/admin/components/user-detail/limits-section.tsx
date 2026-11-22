"use client";

import { useState } from "react";
import { Badge, Button, ContentCard, Icon, KeyValueList, NumberField, RadioField, TextareaField, FormDialog, useToast } from "@/components/ui";
import { errorText } from "@/lib/api/errorText";
import { overrideLimits } from "../../api/admin-billing.api";
import { useAdminBillingLang } from "../../hooks/shared/use-admin-lang";
import type { AccountLimits, AdminUser } from "../../types";
import { changedLimits, isOverridden, limitDraft, REASON_MAX, validateLimits, type LimitChoice, type LimitDraft, type LimitErrors } from "../../utils/billing";

/**
 * What the account may have: brands it owns and editors per brand, as the
 * server enforces them, with an Override badge when an admin changed them.
 * Overriding needs a reason, which the server keeps in the audit log.
 */
export function LimitsSection({ user, onChanged }: { user: AdminUser; onChanged: () => void }) {
  const { b } = useAdminBillingLang();
  const l = b.limits;
  const [open, setOpen] = useState(false);
  const limits = user.limits;
  if (!limits) return null;
  const show = (key: "brands" | "editors") => (
    <span className="inline-flex flex-wrap items-center gap-ctl-row">
      {limits[key] === null ? l.unlimited : <span className="tabular-nums">{limits[key]}</span>}
      {isOverridden(limits, key) && <Badge tone="attention">{l.override}</Badge>}
    </span>
  );

  return (
    <ContentCard
      title={l.title}
      controls={
        <Button variant="secondary" size="sm" icon={<Icon name="sliders" size={16} />} onClick={() => setOpen(true)}>
          {l.action}
        </Button>
      }
    >
      <div className="flex flex-col gap-space-4" data-account-limits>
        {!limits.override && <p className="text-caption text-text-muted">{l.defaults}</p>}
        <KeyValueList
          layout="grid"
          items={[
            { label: l.brands, value: show("brands") },
            { label: l.editors, value: show("editors") },
          ]}
        />
      </div>
      {open && <LimitsDialog user={user} limits={limits} onClose={() => setOpen(false)} onSaved={onChanged} />}
    </ContentCard>
  );
}

function LimitsDialog({ user, limits, onClose, onSaved }: { user: AdminUser; limits: AccountLimits; onClose: () => void; onSaved: () => void }) {
  const { b, lang } = useAdminBillingLang();
  const l = b.limits;
  const { showToast } = useToast();
  const [initial] = useState(() => ({ brands: limitDraft(limits, "brands"), editors: limitDraft(limits, "editors") }));
  const [brands, setBrands] = useState<LimitDraft>(initial.brands);
  const [editors, setEditors] = useState<LimitDraft>(initial.editors);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<LimitErrors>({});
  const options = (["default", "unlimited", "number"] as LimitChoice[]).map((value) => ({ value, label: l.choices[value] }));

  const field = (key: "brands" | "editors", draft: LimitDraft, set: (d: LimitDraft) => void) => (
    <div className="flex flex-col gap-field-stack-compact">
      <RadioField
        label={key === "brands" ? l.brands : l.editors}
        value={draft.choice}
        onChange={(choice) => {
          set({ ...draft, choice: choice as LimitChoice });
          setErrors((prev) => ({ ...prev, [key]: undefined }));
        }}
        options={options}
      />
      {draft.choice === "number" && (
        <NumberField
          label={l.number[key]}
          value={draft.value}
          min={0}
          step={1}
          onChange={(value) => {
            set({ ...draft, value });
            setErrors((prev) => ({ ...prev, [key]: undefined }));
          }}
          error={errors[key] ? l.errors.number : undefined}
        />
      )}
    </div>
  );

  return (
    <FormDialog
      open
      title={l.dialogTitle(user.name || user.email)}
      description={l.dialogBody}
      submitLabel={l.submit}
      errorMessage={l.failed}
      onClose={onClose}
      onSubmit={async () => {
        const found = validateLimits({ brands, editors, reason });
        setErrors(found);
        if (Object.keys(found).length) return false;
        // Only what changed: a limit left out stays as it is on the server.
        const changes = changedLimits(initial, { brands, editors });
        if (!Object.keys(changes).length) return l.errors.unchanged;
        try {
          await overrideLimits(user.id, changes, reason);
          showToast(l.done, "success");
          onSaved();
        } catch (err) {
          return errorText(err, lang, { en: "Couldn't save the limits. Try again.", ar: "تعذّر حفظ الحدود. حاول مرة أخرى." });
        }
      }}
    >
      {field("brands", brands, setBrands)}
      {field("editors", editors, setEditors)}
      <TextareaField
        label={l.reason}
        required
        hint={l.reasonHint}
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setErrors((prev) => ({ ...prev, reason: undefined }));
        }}
        maxLength={REASON_MAX}
        showCount
        rows={3}
        autoGrow
        maxRows={6}
        resizable={false}
        error={errors.reason ? (errors.reason === "required" ? l.errors.reasonRequired : l.errors.reasonTooLong) : undefined}
      />
    </FormDialog>
  );
}
