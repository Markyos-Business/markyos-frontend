"use client";

import { ReactNode, useEffect } from "react";
import { useDocumentLang, useInterfaceLang } from "@/contexts/useInterfaceLang";
import { usePathname, useRouter } from "next/navigation";
import { API_ENABLED } from "@/lib/api/client";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ThemeToggle } from "@/contexts/ThemeProvider";
import { AccountMenu } from "@/components/features/account";
import { AppLayout, AppSidebar, AppTopBar, PageContainer } from "@/components/layout";
import { LangToggle, UiStringsProvider } from "@/components/ui";
import { ADMIN_NAV, SHELL_COPY } from "../../constants";
import { SIDEBAR_RAILS } from "@/lib/sidebarRails";

/**
 * The platform admin area's frame, and its gate.
 *
 * The server refuses every admin call from anyone else; this only keeps a
 * member from landing on a page of errors. Without a backend there is no
 * platform to administer, so the area doesn't exist.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { state, hydrated, setAdminLang } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = API_ENABLED && !!account?.isAdmin;

  useEffect(() => {
    if (!hydrated) return;
    if (!state.session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace("/brands");
  }, [hydrated, state.session, allowed, router, pathname]);

  // The admin's own interface language, the same one the studio uses.
  const { lang, settled } = useInterfaceLang();
  const isAr = lang === "ar";
  const copy = SHELL_COPY[lang];

  // Toasts and dialogs render at the document root, outside this shell's
  // `dir`; they read the direction from <html>.
  useDocumentLang(lang, settled);

  if (!hydrated || !state.session || !allowed) return null;

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const current = ADMIN_NAV.flatMap((s) => s.items).find((i) => isActive(i.href));

  return (
    <UiStringsProvider lang={lang}>
    <AppLayout
      dir={isAr ? "rtl" : "ltr"}
      style={{ fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
      sidebar={
        <AppSidebar
          label={copy.area}
          title={copy.area}
          titleHref="/admin"
          isAr={isAr}
          storageKey={SIDEBAR_RAILS.admin}
          sections={ADMIN_NAV.map((s) => ({
            key: s.key,
            label: s.label[lang],
            items: s.items.map((i) => ({ ...i, label: i.label[lang], active: isActive(i.href) })),
          }))}
          footer={[{ key: "studio", label: copy.back, icon: "arrow-left", href: "/brands" }]}
        />
      }
      topbar={
        <AppTopBar
          title={current?.label[lang]}
          right={
            <>
              <LangToggle value={lang} onChange={(next) => setAdminLang(next)} label={copy.language} scope="chrome" />
              {/* On a phone the theme toggle moves into the account menu. */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <AccountMenu controls={<ThemeToggle />} />
            </>
          }
        />
      }
    >
      <PageContainer>{children}</PageContainer>
    </AppLayout>
    </UiStringsProvider>
  );
}
