"use client";

import { useState } from "react";
import { FormDialog, RadioField } from "@/components/ui";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { AccountType } from "@/types";
import type { AdminUser } from "../../types";
import { useAdminLang } from "../../hooks/shared/use-admin-lang";

export function ChangeTypeDialog({ user, onClose, onSubmit }: {
  user: AdminUser;
  onClose: () => void;
  onSubmit: (type: AccountType) => Promise<string | void>;
}) {
  const { isAr } = useAdminLang();
  const [type, setType] = useState<AccountType | "">(user.accountType ?? "");
  const t = (en: string, ar: string) => isAr ? ar : en;

  return (
    <FormDialog
      open
      title={t("Change account type", "تغيير نوع الحساب")}
      description={user.name || user.email}
      onClose={onClose}
      submitLabel={t("Approve change", "الموافقة على التغيير")}
      onSubmit={() => type ? onSubmit(type) : Promise.resolve(t("Choose an account type.", "اختر نوع الحساب."))}
    >
      <RadioField
        label={t("Account type", "نوع الحساب")}
        value={type}
        onChange={(value) => setType(value as AccountType)}
        options={ACCOUNT_TYPE_KEYS.map((key) => ({
          value: key,
          label: isAr ? ACCOUNT_TYPES[key].arLabel : ACCOUNT_TYPES[key].label,
          description: isAr ? ACCOUNT_TYPES[key].arDescription : ACCOUNT_TYPES[key].description,
        }))}
      />
      <p className="text-caption text-text-muted">{t(
        "Existing brands and editors are kept. New additions follow the selected limits. Existing subscriptions move to this account type's price at their next renewal; a higher price waits for the owner's approval at PayPal.",
        "ستُحفظ العلامات والمحررون الحاليون. تخضع الإضافات الجديدة لحدود النوع المختار. تنتقل الاشتراكات الحالية إلى سعر هذا النوع عند تجديدها القادم، وينتظر السعر الأعلى موافقة المالك في PayPal.",
      )}</p>
    </FormDialog>
  );
}
