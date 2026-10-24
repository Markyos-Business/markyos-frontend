"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, Popover } from "@/components/ui";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { API_ENABLED } from "@/lib/api/client";

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
type MenuLink = { href: string; label: string; arLabel: string; icon: string };

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
    <Popover label={isAr ? "الحساب" : "Account"} button={<Avatar initials={initials} />} width={250}>
      {(close) => (
        <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col py-1.5">
          <div className="px-3.5 py-2.5 flex flex-col gap-0.5" style={{ boxShadow: "inset 0 -1px 0 var(--hairline)" }}>
            <span className="text-[13px] font-semibold truncate">{session?.name || (isAr ? "غير مسجل" : "Signed out")}</span>
            <span dir="ltr" className="text-[11.5px] truncate" style={{ color: "var(--text-muted)", textAlign: isAr ? "right" : "left" }}>
              {session?.email || "—"}
            </span>
          </div>

          {controls && (
            <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 shadow-rule-b sm:hidden">{controls}</div>
          )}

          {phoneLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="mk-nav-item flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] sm:hidden"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon name={item.icon} size={14} style={{ color: "var(--text-faint)" }} />
              {isAr ? item.arLabel : item.label}
            </Link>
          ))}

          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="mk-nav-item flex items-center gap-2.5 px-3.5 py-2.5 text-[13px]"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon name={item.icon} size={14} style={{ color: "var(--text-faint)" }} />
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
            className="mk-nav-item flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] cursor-pointer text-start"
            style={{ color: "var(--text-secondary)", boxShadow: "inset 0 1px 0 var(--hairline)" }}
          >
            <Icon name="sign-out-alt" size={14} style={{ color: "var(--text-faint)" }} />
            {isAr ? "تسجيل الخروج" : "Log out"}
          </button>
        </div>
      )}
    </Popover>
  );
}
