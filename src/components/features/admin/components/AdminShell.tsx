"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_ENABLED } from "@/lib/api/client";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ThemeToggle } from "@/contexts/ThemeProvider";
import { AccountMenu } from "@/components/features/account";
import { AppLayout, AppSidebar, AppTopBar, PageContainer } from "@/components/layout";
import { ADMIN_NAV } from "../constants";

/**
 * The platform admin area's frame, and its gate.
 *
 * The server refuses every admin call from anyone else; this only keeps a
 * member from landing on a page of errors. Without a backend there is no
 * platform to administer, so the area doesn't exist.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { state, hydrated } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = API_ENABLED && !!account?.isAdmin;

  useEffect(() => {
    if (!hydrated) return;
    if (!state.session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace("/brands");
  }, [hydrated, state.session, allowed, router, pathname]);

  if (!hydrated || !state.session || !allowed) return null;

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const current = ADMIN_NAV.flatMap((s) => s.items).find((i) => isActive(i.href));

  return (
    <AppLayout
      dir="ltr"
      sidebar={
        <AppSidebar
          label="Admin"
          title="Admin"
          titleHref="/admin"
          storageKey="markyos:ui:admin-sidebar-collapsed"
          sections={ADMIN_NAV.map((s) => ({
            ...s,
            items: s.items.map((i) => ({ ...i, active: isActive(i.href) })),
          }))}
          footer={[{ key: "studio", label: "Back to studio", icon: "arrow-left", href: "/brands" }]}
        />
      }
      topbar={
        <AppTopBar
          title={current?.label}
          right={
            <>
              <ThemeToggle />
              <AccountMenu />
            </>
          }
        />
      }
    >
      <PageContainer>{children}</PageContainer>
    </AppLayout>
  );
}
