"use client";

import { useState } from "react";
import { AlertBanner, Button, RadioField, Section } from "@/components/ui";
import { useAppActions } from "@/contexts/AppContext";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { Account, AccountType } from "@/types";
import { chooseInitialAccountType } from "../../api/account.api";
import { useAccountLang } from "../../hooks/shared/use-account-lang";
import { errorText } from "@/lib/api/errorText";

export function AccountTypeSection({ account }: { account: Account }) {
  const { t, isAr } = useAccountLang();
  const { setServerAccount } = useAppActions();
  const [choice, setChoice] = useState<AccountType | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (account.isAdmin) return null;

  return (
    <Section title={t("Account type", "نوع الحساب")} icon="user">
      {account.accountType ? (
        <>
          <p className="text-body font-medium">
            {isAr ? ACCOUNT_TYPES[account.accountType].arLabel : ACCOUNT_TYPES[account.accountType].label}
          </p>
          <p className="text-caption text-text-muted">{t(
            "Contact your Markyos administrator to request a different account type. Changes require admin approval and do not reprice existing subscriptions.",
            "تواصل مع مسؤول ماركيوس لطلب نوع حساب مختلف. تتطلب التغييرات موافقة المسؤول ولا تعيد تسعير الاشتراكات الحالية.",
          )}</p>
        </>
      ) : (
        <form className="flex flex-col gap-space-5" onSubmit={async (event) => {
          event.preventDefault();
          if (!choice || busy) return;
          setBusy(true);
          setError(null);
          try {
            setServerAccount(await chooseInitialAccountType(choice));
          } catch (err) {
            setError(errorText(err, isAr ? "ar" : "en", { en: "Could not save your account type.", ar: "تعذر حفظ نوع الحساب." }));
          } finally {
            setBusy(false);
          }
        }}>
          <p className="text-body text-text-muted">{t(
            "Your invitations keep working. Choose who your account is for before creating your own brands. You choose once; later changes need admin approval. This does not start a paid subscription.",
            "ستظل دعواتك تعمل. اختر الفئة المناسبة لحسابك قبل إنشاء علاماتك الخاصة. تختار مرة واحدة؛ تحتاج التغييرات اللاحقة إلى موافقة المسؤول. لا يؤدي هذا الاختيار إلى بدء اشتراك مدفوع.",
          )}</p>
          <AlertBanner message={error} />
          <RadioField
            label={t("Choose your account type", "اختر نوع حسابك")}
            value={choice}
            onChange={(value) => setChoice(value as AccountType)}
            disabled={busy}
            options={ACCOUNT_TYPE_KEYS.map((key) => ({
              value: key,
              label: isAr ? ACCOUNT_TYPES[key].arLabel : ACCOUNT_TYPES[key].label,
              description: isAr ? ACCOUNT_TYPES[key].arDescription : ACCOUNT_TYPES[key].description,
            }))}
          />
          <Button type="submit" disabled={!choice || busy}>
            {busy ? t("Saving…", "جارٍ الحفظ…") : t("Confirm account type", "تأكيد نوع الحساب")}
          </Button>
        </form>
      )}
    </Section>
  );
}
