"use client";

import { useRef } from "react";

import { Avatar, Button, Icon, Section } from "@/components/ui";
import { InputField } from "@/components/form";
import { initialsFor } from "@/lib/utils";
import type { Account } from "@/types";
import { API_ENABLED } from "@/lib/api/client";
import type { AvatarState } from "../../hooks/profile/useAvatar";
import type { ProfileDetailsState } from "../../hooks/profile/useProfileDetails";
import { useAccountLang } from "../../hooks/shared/useAccountLang";

type ProfileSectionProps = { account: Account; details: ProfileDetailsState; avatar: AvatarState };

/** Who you are: photo, name and the email you sign in with. */
export function ProfileSection({ account, details, avatar }: ProfileSectionProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const { t } = useAccountLang();
  return (
    <Section title={t("Profile", "الملف الشخصي")} icon="user">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar initials={initialsFor(account.name || account.email)} src={account.avatarUrl} size={56} tone="accent" />
        <div className="min-w-0 flex-1">
          <div dir="auto" className="bidi-auto text-h5 font-medium truncate">{account.name}</div>
          <div dir="ltr" className="text-caption truncate text-text-muted">{account.email}</div>
        </div>
        {/* A photo needs somewhere to keep it: the server. */}
        {API_ENABLED && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept={avatar.accept}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                avatar.onPick(e.target.files?.[0]);
                // Cleared, so choosing the same file again still counts.
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" icon={<Icon name="upload" size={16} />} onClick={() => fileInput.current?.click()} disabled={avatar.busy}>
              {account.avatarUrl ? t("Change photo", "تغيير الصورة") : t("Upload photo", "رفع صورة")}
            </Button>
            {account.avatarUrl && (
              <Button variant="link" onClick={avatar.remove} disabled={avatar.busy}>
                {t("Remove", "إزالة")}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <InputField
          label={t("Name", "الاسم")}
          value={details.name}
          dir="auto"
          onChange={(e) => details.setName(e.target.value)}
          onBlur={details.commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") details.resetName();
          }}
          placeholder={t("Your name", "اسمك")}
        />
        <InputField
          label={t("Email", "البريد الإلكتروني")}
          type="email"
          value={details.email}
          dir="ltr"
          error={details.emailError}
          onChange={(e) => details.setEmail(e.target.value)}
          onBlur={details.commitEmail}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") details.resetEmail();
          }}
          placeholder="you@studio.com"
          hint={
            details.pendingEmail
              ? undefined
              : t("This is the address you sign in with. A new one is confirmed from its inbox first.", "هذا هو البريد الذي تسجّل الدخول به. أي بريد جديد يُؤكَّد من صندوقه أولًا.")
          }
        />
      </div>

      {details.pendingEmail && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-widget bg-surface-sunken px-space-6 py-space-4 shadow-edge-soft">
          <p className="text-caption text-text-muted">
            {t("Waiting for confirmation:", "بانتظار التأكيد:")}{" "}
            <span dir="ltr" className="font-medium text-text">
              {details.pendingEmail}
            </span>
            . {t("Until then you sign in with", "حتى ذلك الحين تسجّل الدخول بـ")} <span dir="ltr">{account.email}</span>.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={details.resendPending}>
              {t("Resend", "إعادة الإرسال")}
            </Button>
            <Button type="button" variant="link" onClick={details.cancelPending}>
              {t("Cancel", "إلغاء")}
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}
