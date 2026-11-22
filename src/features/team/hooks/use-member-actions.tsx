"use client";

import { useRouter } from "next/navigation";
import { useAccountCopy } from "@/contexts/useAccountCopy";
import { billingCopy, transferBlocked } from "@/features/billing";
import { useAppActions } from "@/contexts/AppContext";
import { useDialog, useToast } from "@/components/ui";
import type { TeamMember, TeamRole, Workspace } from "@/types";
import { ROLE_LABELS } from "../constants";

/**
 * What an owner can do to a member of the team: hand the brand over, change
 * their role, or remove them. One hook for the whole table, so the row menu
 * (a plain function per row) can call it without a hook per row.
 */
export function useMemberActions(ws: Workspace, isAr: boolean) {
  const { removeTeamMember, setTeamRole, transferOwnership } = useAppActions();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const router = useRouter();
  const copy = useAccountCopy(isAr);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const roleName = (r: TeamRole) => (r === "client" ? copy.reviewerLabel : ROLE_LABELS[r][isAr ? "ar" : "en"]);

  /**
   * Hands the brand over.
   *
   * Confirmed in words that say what is lost, not just what is gained: the
   * person doing this is giving up the ability to undo it. After it lands they
   * are an editor, so the control that did it is gone from their screen too —
   * which is why the guard is typing the brand's name rather than a second
   * click. A misclick can repeat a click; nothing can undo the result.
   */
  async function transfer(m: TeamMember) {
    // An active plan stays with its payer: cancel it at the period end first (D4).
    // The server refuses the same transfer (transfer_blocked_billing).
    if (transferBlocked(ws.billing)) {
      const words = billingCopy(isAr).transfer;
      const go = await confirm({ title: words.title, body: words.body(ws.name), confirmLabel: words.action, cancelLabel: words.close, isAr });
      if (go) router.push(`/w/${ws.slug}/settings?tab=billing&cancel=1`);
      return;
    }
    const who = m.name || m.email;
    const ok = await confirm({
      title: isAr ? `نقل ملكية ${ws.name}؟` : `Transfer ${ws.name}?`,
      body: isAr ? (
        <>
          تنتقل الملكية إلى <strong className="text-text">{who}</strong>. تبقى في العلامة كمحرّر، ولا يمكنك التراجع عن ذلك.
        </>
      ) : (
        <>
          Ownership moves to <strong className="text-text">{who}</strong>. You stay on the brand as an editor, and this cannot be undone from your side.
        </>
      ),
      consequences: [
        t("Only the new owner can change roles or approve proposals", "المالك الجديد وحده يغيّر الأدوار ويعتمد المقترحات"),
        t("Only the new owner can transfer ownership again — including back to you", "المالك الجديد وحده ينقل الملكية مجددًا، بما في ذلك إعادتها إليك"),
        t("Sharing and the guideline link move with it", "تنتقل معها المشاركة ورابط الدليل"),
      ],
      confirmPhrase: ws.name,
      confirmLabel: t("Transfer", "نقل الملكية"),
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    transferOwnership(ws.id, m.id);
    showToast(isAr ? `أصبح ${who} المالك، وأنت الآن محرّر في هذه العلامة.` : `${who} is now the owner. You're an editor on this brand.`, "success");
  }

  async function remove(m: TeamMember) {
    const who = m.name || m.email;
    const ok = await confirm({
      title: isAr ? `إزالة ${who}؟` : `Remove ${who}?`,
      body: t("They lose access to this brand immediately. Anything they already edited stays.", "يفقد الوصول إلى هذه العلامة فورًا، ويبقى ما عدّله سابقًا."),
      confirmLabel: t("Remove", "إزالة"),
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    removeTeamMember(ws.id, m.id);
    showToast(isAr ? `أُزيل ${who} من الفريق.` : `${who} removed from the team.`);
  }

  const setRole = (m: TeamMember, role: TeamRole) => setTeamRole(ws.id, m.id, role);

  return { roleName, transfer, remove, setRole };
}
