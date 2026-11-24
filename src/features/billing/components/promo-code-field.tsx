"use client";

import { Button, FilterChip, InputField } from "@/components/ui";
import type { BillingCopy } from "../copy";
import { promoProblemText, type PromoCodeState } from "../hooks/use-promo-code";
import { PROMO_CODE_MAX } from "../utils/promo";

/**
 * Under the price: a quiet "Have a code?" that opens a field and Apply;
 * once the server accepts the code, the code as a chip with a remove ×. The
 * price itself is the modal's, from the server's terms.
 */
export function PromoCodeField({ promo, copy, isAr }: { promo: PromoCodeState; copy: BillingCopy; isAr: boolean }) {
  const p = copy.promo;

  if (promo.terms) {
    return (
      <div className="flex flex-wrap items-center gap-ctl-row" data-promo-applied>
        <FilterChip label={promo.terms.code} onRemove={promo.remove} removeLabel={p.remove(promo.terms.code)} />
        <span role="status" className="sr-only">
          {p.applied(promo.terms.code)}
        </span>
      </div>
    );
  }

  if (!promo.open) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => promo.setOpen(true)}>
          {p.have}
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!promo.busy) void promo.apply();
      }}
    >
      <InputField
        label={p.label}
        value={promo.text}
        onChange={(event) => promo.type(event.target.value)}
        maxLength={PROMO_CODE_MAX}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        autoFocus
        boxDir="ltr"
        inputClassName="uppercase"
        error={promo.problem ? promoProblemText(promo.problem, isAr) : undefined}
        action={
          <Button type="submit" variant="secondary" size="sm" loading={promo.busy} loadingText={p.applying}>
            {p.apply}
          </Button>
        }
      />
    </form>
  );
}
