"use client";

import { useAccountCopy } from "@/contexts/useAccountCopy";
import { useApp } from "@/contexts/AppContext";
import { FilterSelectField } from "@/components/form";
import { Badge, Button, Icon, IconButton, useDialog, useToast } from "@/components/ui";
import type { TeamMember, TeamRole, Workspace } from "@/types";
import { ROLES, ROLE_LABELS, ROLE_TONE } from "../../constants";

type MemberControlsProps = {
  ws: Workspace;
  member: TeamMember;
  isAr: boolean;
  canGovern: boolean;
  editorsFull: boolean;
};

/** A team row's controls: make owner, the role, and remove — or just the role, for someone who can't govern. */
export function MemberControls({ ws, member: m, isAr, canGovern, editorsFull }: MemberControlsProps) {
  const { removeTeamMember, setTeamRole, transferOwnership } = useApp();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const who = m.name || m.email;
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const copy = useAccountCopy(isAr);
  const roleName = (r: TeamRole) => r === "client" ? copy.reviewerLabel : ROLE_LABELS[r][isAr ? "ar" : "en"];

  /**
   * Hands the brand over.
   *
   * Confirmed in words that say what is lost, not just what is gained: the
   * person doing this is giving up the ability to undo it. After it lands they
   * are an editor, so the control that did it is gone from their screen too —
   * which is why the guard is typing the brand's name rather than a second
   * click. A misclick can repeat a click; nothing can undo the result.
   */
  async function transfer() {
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
        t("Sharing, the guideline link and the subdomain move with it", "تنتقل معها المشاركة ورابط الدليل والنطاق الفرعي"),
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

  async function remove() {
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

  if (!canGovern) return <Badge tone={ROLE_TONE[m.role]}>{roleName(m.role)}</Badge>;

  return (
    <div className="flex items-center gap-2">
      {/* Always rendered, disabled on the person who already owns the brand:
          hiding it on that row shifted every other row's controls sideways. */}
      <Button
        variant="soft"
        size="xs"
        disabled={m.role === "owner"}
        onClick={() => void transfer()}
        title={
          m.role === "owner"
            ? isAr ? `${who} يملك ${ws.name} بالفعل` : `${who} already owns ${ws.name}`
            : isAr ? `نقل ملكية ${ws.name} إلى ${who}` : `Transfer ownership of ${ws.name} to ${who}`
        }
        icon={<Icon name="key" size={16} />}
        className="shrink-0"
      >
        {t("Make owner", "تعيين مالكًا")}
      </Button>
      <FilterSelectField
        label={isAr ? `دور ${who}` : `Role for ${who}`}
        hideLabel
        size="sm"
        value={m.role}
        onChange={(value) => setTeamRole(ws.id, m.id, value as TeamRole)}
        options={ROLES.map((r) => ({ value: r, label: roleName(r), disabled: r === "editor" && editorsFull && m.role !== "editor" }))}
      />
      <IconButton
        icon="times"
        label={isAr ? `إزالة ${m.name}` : `Remove ${m.name}`}
        title={isAr ? `إزالة ${who} من هذه العلامة` : `Remove ${who} from this brand`}
        onClick={() => void remove()}
        className="mk-danger-hover cursor-pointer text-text-faint"
      />
    </div>
  );
}
