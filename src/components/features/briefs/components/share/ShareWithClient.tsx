"use client";

import { Button, FormSheet, Icon, IconButton, Tag } from "@/components/ui";
import { CheckboxField, SelectField } from "@/components/form";
import { formatDay } from "@/components/features/discovery";
import { SECTION_META, SECTION_ORDER } from "../../constants";
import { useShareLinks } from "../../hooks/share/useShareLinks";
import type { Expiry } from "../../hooks/share/useShareLinks";
import type { BriefAnalysis } from "../../types";

/**
 * "Share with client": a read-only link to the sections the studio picks.
 * The client sees what they wrote in their forms as the evidence, never the
 * studio's call notes.
 */
export function ShareWithClient({ analysis, isAr }: { analysis: BriefAnalysis; isAr: boolean }) {
  const share = useShareLinks(analysis, isAr);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";
  const live = share.live;

  return (
    <>
      <Button variant="outline" icon={<Icon name="share-alt" size={18} />} onClick={share.start}>
        {t("Share with client", "مشاركة مع العميل")}
      </Button>
      <FormSheet
        open={share.open}
        title={t("Share with your client", "المشاركة مع عميلك")}
        description={t(
          "A read-only link to the sections you choose. It cites only what the client wrote in their forms, never your call notes.",
          "رابط للقراءة فقط للأقسام التي تختارها. يستشهد فقط بما كتبه العميل في نماذجه، وليس بملاحظات مكالماتك أبدًا."
        )}
        submitLabel={t("Create link", "إنشاء رابط")}
        onClose={share.close}
        onSubmit={share.create}
      >
        {live.length > 0 && (
          <section className="flex flex-col gap-space-3">
            <h3 className="text-caption font-medium text-text-muted">{t("Links in use", "روابط مستخدمة")}</h3>
            <ul className="flex flex-col gap-space-3">
              {live.map((link) => (
                <li key={link.id} className="flex flex-col gap-space-2 rounded-widget bg-surface-2 p-space-5">
                  <div className="flex items-center gap-space-3">
                    <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-caption text-text">
                      {share.urlOf(link)}
                    </span>
                    <IconButton icon="copy" iconSize={16} label={t("Copy link", "نسخ الرابط")} onClick={() => void share.copy(link)} />
                    <IconButton icon="unlink" iconSize={16} label={t("Turn link off", "إيقاف الرابط")} onClick={() => void share.revoke(link)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-space-3 text-caption text-text-muted">
                    <Tag>{t(`${link.sections.length} sections`, `${link.sections.length} أقسام`)}</Tag>
                    <span>{t(`${link.viewCount} views`, `${link.viewCount} مشاهدات`)}</span>
                    <span>·</span>
                    <span>
                      {link.expiresAt ? t(`Until ${formatDay(link.expiresAt, false)}`, `حتى ${formatDay(link.expiresAt, true)}`) : t("No end date", "بلا تاريخ انتهاء")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <fieldset className="flex flex-col gap-space-3">
          <legend className="mb-space-3 text-caption font-medium text-text-muted">{t("Sections in a new link", "أقسام الرابط الجديد")}</legend>
          {SECTION_ORDER.map((key) => (
            <CheckboxField key={key} label={SECTION_META[key][lang]} checked={share.sections.includes(key)} onChange={() => share.toggle(key)} />
          ))}
        </fieldset>
        <SelectField
          label={t("Link works for", "صلاحية الرابط")}
          value={share.expiry}
          onChange={(e) => share.setExpiry(e.target.value as Expiry)}
          options={[
            { value: "7", label: t("7 days", "7 أيام") },
            { value: "30", label: t("30 days", "30 يومًا") },
            { value: "never", label: t("Until turned off", "حتى يُوقف") },
          ]}
        />
      </FormSheet>
    </>
  );
}
