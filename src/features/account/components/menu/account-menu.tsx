"use client";

import { initialsFor } from "@/lib/utils";
import Link from "next/link";
import { NotificationBell } from "@/features/notifications";
import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, LangToggle, Popover } from "@/components/ui";
import { useAppActions, useCurrentAccount, useSession } from "@/contexts/AppContext";
import { ThemeToggle } from "@/components/ui";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";
import { api, API_ENABLED } from "@/lib/api/client";
import type { MenuLink } from "../../types";

/**
 * The way to your own account, from wherever you are.
 *
 * The avatar in the top bar was a plain `div` — the one thing in the interface
 * that every convention says is a button, and it did nothing. So the account
 * page existed and, from inside a brand, there was no route to it at all: the
 * only link lived in the header of the brand gallery. This makes the avatar do
 * what it looks like it does, and names who is signed in while it's open,
 * which is the other half of what people open an avatar for.
 */
export const AccountMenu = memo(function AccountMenu({
  isAr: isArProp,
  phoneLinks = [],
  variant = "avatar",
  compact = false,
}: {
  /** The page's language; the person's own interface language when not given. */
  isAr?: boolean;
  /** Account navigation available in the menu at every viewport. */
  phoneLinks?: MenuLink[];
  /**
   * `avatar` (top bar): the bell, then the avatar. `row` (sidebar bottom bar):
   * avatar, name and an ellipsis, without the bell, which stays in the top bar.
   */
  variant?: "avatar" | "row";
  /** In the collapsed rail the row is the avatar alone. */
  compact?: boolean;
}) {
  const { logout } = useAppActions();
  const interfaceLang = useInterfaceLang();
  const isAr = isArProp ?? interfaceLang.isAr;
  const account = useCurrentAccount();
  const router = useRouter();
  const session = useSession();
  // One letter of the signed-in name (or email); never a made-up stand-in.
  const initials = initialsFor(account?.name || session?.name || session?.email || "");

  const items: MenuLink[] = [
    { href: "/account?tab=profile", label: "Profile", arLabel: "الملف الشخصي", icon: "user" },
    { href: "/account?tab=billing", label: "Subscription & payments", arLabel: "الاشتراك والمدفوعات", icon: "credit-card" },
    { href: "/account?tab=organisation", label: "Organisation", arLabel: "المؤسسة", icon: "shield-alt" },
  ];
  // Markyos operators only; the platform admin area needs the backend.
  if (API_ENABLED && account?.isAdmin) {
    items.push({ href: "/admin", label: "Platform admin", arLabel: "إدارة المنصة", icon: "key" });
  }
  // Content managers and the editors a content admin added aren't platform
  // admins, so this is how they find the CMS. Asked once, the first time the
  // menu opens, not per page.
  const [contentAccess, setContentAccess] = useState<boolean | null>(null);
  const checkContentAccess = () => {
    if (!API_ENABLED || !session || contentAccess !== null) return;
    if (account?.isAdmin || account?.role === "content") return setContentAccess(true);
    // Direct: one small call, without pulling the CMS screens into the menu.
    api<{ role: string | null }>("/content/me/")
      .then((me) => setContentAccess(me.role !== null))
      .catch(() => setContentAccess(false));
  };
  if (contentAccess || (API_ENABLED && (account?.isAdmin || account?.role === "content"))) {
    items.push({ href: "/admin/cms", label: "Website content", arLabel: "محتوى الموقع", icon: "globe" });
  }

  return (
    <div className="flex min-w-0 items-center gap-space-3">{variant === "avatar" && <NotificationBell isAr={isAr}/>}<Popover
      className={variant === "row" ? "min-w-0 flex-1" : undefined}
      label={isAr ? "الحساب" : "Account"}
      width={250}
      onOpen={checkContentAccess}
      trigger={variant === "row" && !compact ? "block" : "plain"}
      align={variant === "row" ? "start" : "end"}
      button={variant === "row" && !compact ? (
        <span className="flex min-w-0 flex-1 items-center gap-space-4 rounded-lg py-space-2 text-start">
          <Avatar initials={initials} src={account?.avatarUrl} size={28} />
          <span dir="auto" className="min-w-0 flex-1 truncate text-body font-medium text-text [text-align:match-parent]">{session?.name || session?.email}</span>
          <Icon name="ellipsis-h" size={16} className="shrink-0 text-text-muted" />
        </span>
      ) : <Avatar initials={initials} src={account?.avatarUrl} size={variant === "row" ? 28 : 40} />}
    >
      {(close) => (
        <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col py-space-2">
          <div className="px-space-6 py-space-4 flex flex-col shadow-rule-b">
            <span className="text-body font-medium truncate">{session?.name || (isAr ? "غير مسجل" : "Signed out")}</span>
            <span dir="ltr" className="text-caption truncate text-text-muted" style={{ textAlign: isAr ? "right" : "left" }}>
              {session?.email || "—"}
            </span>
          </div>

          {/* Mode and language, each named, on every page: the same place to change them everywhere. */}
          <div className="flex flex-col gap-space-3 px-space-6 py-space-4 shadow-rule-b">
            <div className="flex items-center justify-between gap-space-4">
              <span className="text-body text-text-muted">{isAr ? "الوضع" : "Mode"}</span>
              <ThemeToggle isAr={isAr} />
            </div>
            <div className="flex items-center justify-between gap-space-4">
              <span className="text-body text-text-muted">{isAr ? "اللغة" : "Language"}</span>
              <LangToggle value={interfaceLang.lang} onChange={interfaceLang.setLang} label={isAr ? "اللغة" : "Language"} scope="chrome" />
            </div>
          </div>

          {/* The header shows these as a nav bar from tablet width up; only a
              phone, where that bar is hidden, needs them here. */}
          {phoneLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="mk-nav-item flex items-center gap-space-4 px-space-6 py-space-4 text-body md:hidden"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon name={item.icon} size={16} style={{ color: "var(--text-muted)" }} />
              {isAr ? item.arLabel : item.label}
            </Link>
          ))}

          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="mk-nav-item flex items-center gap-ctl-icon px-space-6 py-space-4 text-body"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon name={item.icon} size={16} style={{ color: "var(--text-muted)" }} />
              {isAr ? item.arLabel : item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => {
              close();
              logout();
              router.replace("/login");
            }}
            className="mk-nav-item flex items-center gap-space-4 px-space-6 py-space-4 text-body cursor-pointer text-start text-text-secondary shadow-rule-t"
            
          >
            <Icon name="sign-out-alt" size={16} style={{ color: "var(--text-muted)" }} />
            {isAr ? "تسجيل الخروج" : "Log out"}
          </button>
        </div>
      )}
    </Popover></div>
  );
});
