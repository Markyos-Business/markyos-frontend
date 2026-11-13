"use client";

import { useApp } from "@/contexts/AppContext";
import { Button, DataTable, Icon, Row, Section, Tag, useToast } from "@/components/ui";
import type { DataColumn } from "@/components/ui";
import { API_ENABLED } from "@/lib/api/client";
import { formatRelative } from "@/lib/utils";
import type { Account } from "@/types";
import type { MySessionsState } from "../../hooks/profile/use-my-sessions";
import type { MySession } from "../../types";
import { useAccountLang } from "../../hooks/shared/use-account-lang";

type SessionSectionProps = { account: Account; sessions: MySessionsState };

/** Every browser you're signed in on: sign one out, the others, or this one. */
export function SessionSection({ account, sessions }: SessionSectionProps) {
  const { logout } = useApp();
  const { showToast } = useToast();
  const { t, isAr } = useAccountLang();
  const signOutHere = () => {
    logout();
    showToast(t("Signed out.", "تم تسجيل الخروج."));
  };

  // The browser-only build has one session: this tab's.
  if (!API_ENABLED) {
    return (
      <Section title={t("Session", "الجلسة")} icon="lock">
        <Row
          label={t("Signed in", "مسجّل الدخول")}
          hint={
            isAr
              ? `منذ آخر تسجيل دخول في هذا المتصفح${account.createdAt ? ` · أُنشئ الحساب ${formatRelative(account.createdAt)}` : ""}.`
              : `Since this browser last authenticated${account.createdAt ? ` · account created ${formatRelative(account.createdAt)}` : ""}.`
          }
          right={
            <Button variant="outline" size="sm" icon={<Icon name="sign-out-alt" size={16} />} onClick={signOutHere}>
              {t("Sign out", "تسجيل الخروج")}
            </Button>
          }
        />
      </Section>
    );
  }

  const columns: DataColumn<MySession>[] = [
    {
      key: "device",
      header: t("Device", "الجهاز"),
      sortable: false,
      cell: (s) => (
        <div className="flex flex-wrap items-center gap-space-4">
          <Icon name={s.mobile ? "mobile" : "laptop"} size={18} className="text-text-muted" />
          <span className="font-medium text-text">{sessions.deviceName(s)}</span>
          {s.current && <Tag tone="primary">{t("This browser", "هذا المتصفح")}</Tag>}
        </div>
      ),
    },
    { key: "ip", header: t("IP address", "عنوان IP"), sortable: false, cell: (s) => <span dir="ltr">{s.ip ?? "—"}</span>, className: "hidden md:table-cell" },
    {
      key: "lastSeen",
      header: t("Last active", "آخر نشاط"),
      sortable: false,
      cell: (s) => <span className="text-text-muted">{s.current ? t("Now", "الآن") : formatRelative(Date.parse(s.lastSeenAt))}</span>,
    },
    {
      key: "action",
      header: t("Sign out", "تسجيل الخروج"),
      hideHeader: true,
      sortable: false,
      className: "text-end",
      cell: (s) => (
        <Button variant="outline" size="xs" onClick={() => (s.current ? signOutHere() : sessions.signOut(s))}>
          {t("Sign out", "تسجيل الخروج")}
        </Button>
      ),
    },
  ];

  return (
    <Section
      title={t("Sessions", "الجلسات")}
      icon="lock"
      right={
        sessions.others > 0 ? (
          <Button variant="danger-soft" size="sm" onClick={sessions.signOutOthers}>
            {t("Sign out of other browsers", "تسجيل الخروج من المتصفحات الأخرى")}
          </Button>
        ) : undefined
      }
    >
      <DataTable
        label={t("Signed-in browsers", "المتصفحات المسجّلة")}
        itemLabel={t("sessions", "جلسات")}
        columns={columns}
        rows={sessions.data ?? undefined}
        getRowId={(s) => s.id}
        getRowLabel={sessions.deviceName}
        loading={sessions.loading}
        error={sessions.error}
        onRetry={sessions.reload}
        empty={<p className="p-space-6 text-caption text-text-muted">{t("Only this browser is signed in.", "هذا المتصفح وحده مسجّل الدخول.")}</p>}
        stickyHeader={false}
      />
    </Section>
  );
}
