"use client";

import { CenteredMessage } from "@/components/features/guideline-site";
import type { SharePageState } from "../hooks/useSharePage";
import { ShareBody } from "./ShareBody";
import { ShareHeader } from "./ShareHeader";

/**
 * A share link as its reader sees it. Not the guideline site: that is the
 * finished deliverable and publishes a frozen snapshot. This reads the *live*
 * workspace, for the middle of the work, and carries no editor, no
 * navigation into the app, and no way to change anything.
 */
export function ShareView({ share }: { share: SharePageState }) {
  if (share.state === "missing") {
    return (
      <CenteredMessage
        icon="unlink"
        title="This link doesn't work"
        arTitle="هذا الرابط لا يعمل"
        body="It may have been mistyped, or it belongs to a brand kept in a different browser. Ask whoever sent it for a fresh link."
        arBody="قد يكون الرابط غير صحيح، أو يخص علامة محفوظة في متصفح آخر. اطلب رابطًا جديدًا ممن أرسله."
        isAr={share.isAr}
      />
    );
  }
  if (share.state === "revoked") {
    return (
      <CenteredMessage
        icon="lock"
        title="This link was switched off"
        arTitle="تم إيقاف هذا الرابط"
        body="The studio revoked it. Ask them to share a new one if you still need access."
        arBody="أوقفه الاستوديو. اطلب منهم رابطًا جديدًا إن كنت ما زلت بحاجة إليه."
        isAr={share.isAr}
      />
    );
  }
  if (share.state === "gone") {
    return (
      <CenteredMessage
        icon="exclamation-circle"
        title="That department no longer exists"
        arTitle="لم يعد هذا القسم موجودًا"
        body="It was removed from this brand after the link was shared."
        arBody="تمت إزالته من هذه العلامة بعد مشاركة الرابط."
        isAr={share.isAr}
      />
    );
  }
  return (
    <div dir={share.isAr ? "rtl" : "ltr"} className={`flex min-h-screen flex-col bg-canvas text-text ${share.isAr ? "font-arabic" : "font-sans"}`}>
      <ShareHeader share={share} />
      <ShareBody share={share} />
    </div>
  );
}
