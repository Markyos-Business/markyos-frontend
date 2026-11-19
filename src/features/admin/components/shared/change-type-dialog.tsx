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
        "Existing brands and editors are kept. New additions follow the selected limits. Existing subscriptions and their prices stay unchanged; future checkout uses this account type.",
        "ستُحفظ العلامات والمحررون الحاليون. تخضع الإضافات الجديدة لحدود النوع المختار. لن تتغير الاشتراكات الحالية أو أسعارها؛ يستخدم الدفع الجديد نوع الحساب المختار.",
      )}</p>
    </FormDialog>
  );
}
