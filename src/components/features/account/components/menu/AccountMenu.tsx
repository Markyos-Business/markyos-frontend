"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, Popover } from "@/components/ui";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { API_ENABLED } from "@/lib/api/client";
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
export function AccountMenu({
  isAr = false,
  controls,
  phoneLinks = [],
}: {
  isAr?: boolean;
  /**
   * Controls the top bar shows inline but has no room for on a phone (theme,
   * interface language). Shown in the menu below `sm` only, so they are never
   * in two places on the same screen.
   */
  controls?: ReactNode;
  /** Header links that fold into the menu on a phone, e.g. Board, Templates. */
  phoneLinks?: MenuLink[];
}) {
  const { state, logout } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  const session = state.session;
  const initials = session ? session.name.slice(0, 2).toUpperCase() : "ND";

  const items: MenuLink[] = [
    { href: "/account?tab=profile", label: "Profile", arLabel: "الملف الشخصي", icon: "user" },
    { href: "/account?tab=billing", label: "Subscription & payments", arLabel: "الاشتراك والمدفوعات", icon: "credit-card" },
    { href: "/account?tab=organisation", label: "Organisation", arLabel: "المؤسسة", icon: "shield-alt" },
  ];
  // Markyos operators only; the platform admin area needs the backend.
  if (API_ENABLED && account?.isAdmin) {
    items.push({ href: "/admin", label: "Platform admin", arLabel: "إدارة المنصة", icon: "key" });
  }

  return (
    <Popover label={isAr ? "الحساب" : "Account"} button={<Avatar initials={initials} src={account?.avatarUrl} size={40} />} width={250}>
      {(close) => (
        <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col py-space-2">
          <div className="px-space-6 py-space-4 flex flex-col shadow-rule-b">
            <span className="text-body font-medium truncate">{session?.name || (isAr ? "غير مسجل" : "Signed out")}</span>
            <span dir="ltr" className="text-caption truncate" style={{ color: "var(--text-muted)", textAlign: isAr ? "right" : "left" }}>
              {session?.email || "—"}
            </span>
          </div>

          {controls && (
            <div className="flex flex-wrap items-center gap-space-4 px-space-6 py-space-4 shadow-rule-b sm:hidden">{controls}</div>
          )}

          {phoneLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="mk-nav-item flex items-center gap-space-4 px-space-6 py-space-4 text-body sm:hidden"
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
              className="mk-nav-item flex items-center gap-space-4 px-space-6 py-space-4 text-body"
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
            className="mk-nav-item flex items-center gap-space-4 px-space-6 py-space-4 text-body cursor-pointer text-start"
            style={{ color: "var(--text-secondary)", boxShadow: "inset 0 1px 0 var(--hairline)" }}
          >
            <Icon name="sign-out-alt" size={16} style={{ color: "var(--text-muted)" }} />
            {isAr ? "تسجيل الخروج" : "Log out"}
          </button>
        </div>
      )}
    </Popover>
  );
}
