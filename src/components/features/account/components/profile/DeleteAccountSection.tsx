"use client";

import { Button, FormDialog, Icon, Row, Section } from "@/components/ui";
import { InputField } from "@/components/form";
import { PasswordField } from "@/components/features/auth";
import type { Account } from "@/types";
import type { DeleteAccountState } from "../../hooks/profile/useDeleteAccount";
import { useAccountLang } from "../../hooks/shared/useAccountLang";

type DeleteAccountSectionProps = { account: Account; deletion: DeleteAccountState };

/** The way out: delete the account and everything it owns, now. */
export function DeleteAccountSection({ account, deletion }: DeleteAccountSectionProps) {
  const { ownedCount, people } = deletion;
  const { t, isAr } = useAccountLang();
  return (
    <Section title={t("Delete account", "حذف الحساب")} icon="trash">
      <Row
        label={t("Delete your account", "احذف حسابك")}
        hint={t("Deletes your account and the brands you own straight away. It can't be undone.", "يحذف حسابك والعلامات التي تملكها فورًا، ولا يمكن التراجع عنه.")}
        right={
          <Button variant="danger" size="sm" icon={<Icon name="trash" size={16} />} onClick={deletion.start}>
            {t("Delete account", "حذف الحساب")}
          </Button>
        }
      />
      <FormDialog
        open={deletion.open}
        title={t("Delete your account?", "حذف حسابك؟")}
        description={
          <ul className="flex list-disc flex-col gap-space-2 ps-space-6">
            <li>
              {ownedCount === 0
                ? t("You don’t own any brands.", "لا تملك أي علامة.")
                : isAr
                  ? `تُحذف ${ownedCount} ${ownedCount === 1 ? "علامة" : "علامات"} تملكها، مع كل ما فيها.`
                  : `${ownedCount} brand${ownedCount === 1 ? "" : "s"} you own ${ownedCount === 1 ? "is" : "are"} deleted, with everything in ${ownedCount === 1 ? "it" : "them"}.`}
            </li>
            {people > 0 && (
              <li>
                {isAr ? `يفقد ${people} ${people === 1 ? "شخص" : "أشخاص"} الوصول إليها.` : `${people} ${people === 1 ? "person loses" : "people lose"} access to them.`}
              </li>
            )}
            <li>{t("You’re taken off every brand you’re on as a team member.", "تُزال من كل علامة أنت عضو في فريقها.")}</li>
            <li>{t("This can’t be undone.", "لا يمكن التراجع عن هذا.")}</li>
          </ul>
        }
        submitLabel={t("Delete account", "حذف الحساب")}
        onClose={deletion.close}
        onSubmit={deletion.submit}
      >
        {deletion.hasPassword ? (
          <PasswordField
            label={t("Enter your password to confirm", "أدخل كلمة المرور للتأكيد")}
            value={deletion.proof}
            onChange={(e) => deletion.setProof(e.target.value)}
            autoComplete="current-password"
            autoFocus
          />
        ) : (
          <InputField
            label={isAr ? `اكتب ${account.email} للتأكيد` : `Type ${account.email} to confirm`}
            type="email"
            dir="ltr"
            value={deletion.proof}
            onChange={(e) => deletion.setProof(e.target.value)}
            autoFocus
          />
        )}
      </FormDialog>
    </Section>
  );
}
