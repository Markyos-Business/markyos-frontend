"use client";

import { ReactNode, useEffect } from "react";
import { useDocumentLang, useInterfaceLang } from "@/contexts/useInterfaceLang";
import { usePathname, useRouter } from "next/navigation";
import { API_ENABLED } from "@/lib/api/client";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ThemeToggle } from "@/components/ui";
import { AccountMenu } from "@/features/account";
import { CMS_HOME, useCmsNav } from "@/features/content";
import { AppLayout, PageContainer } from "@/features/shell";
import { AppSidebar, AppTopBar } from "@/components/ui";
import { LangToggle, UiStringsProvider } from "@/components/ui";
import { ADMIN_NAV, SHELL_COPY } from "../../constants";
import { SIDEBAR_RAILS } from "@/lib/sidebarRails";

/**
 * The admin area's frame, and its gate.
 *
 * Platform admins see everything: the dashboard, users and the CMS. Content
 * managers, and the editors and viewers a content admin added, see only the
 * CMS sections the server gives them. The server refuses every other call
 * anyway; this only keeps people from landing on a page of errors. Without a
 * backend there is no platform to administer, so the area doesn't exist.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { state, hydrated } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !state.session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, state.session, router, pathname]);

  // Only once the session is back: asking what CMS access someone has before
  // the sign-in token is restored answers 401.
  if (!API_ENABLED || !hydrated || !state.session) return null;
  return <AdminFrame>{children}</AdminFrame>;
}

function AdminFrame({ children }: { children: ReactNode }) {
  const { setAdminLang } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  const pathname = usePathname();
  const cms = useCmsNav();
  const platformAdmin = !!account?.isAdmin;
  const inCms = pathname === CMS_HOME || pathname.startsWith(`${CMS_HOME}/`);
  const allowed = platformAdmin || (!!cms.role && inCms);

  useEffect(() => {
    if (cms.loading || allowed) return;
    // Someone with CMS access but not the platform goes to the CMS; anyone
    // else back to the studio.
    router.replace(cms.role ? CMS_HOME : "/brands");
  }, [cms.loading, cms.role, allowed, router]);

  // The admin's own interface language, the same one the studio uses.
  const { lang, settled } = useInterfaceLang();
  const isAr = lang === "ar";
  const copy = SHELL_COPY[lang];

  // Toasts and dialogs render at the document root, outside this shell's
  // `dir`; they read the direction from <html>.
  useDocumentLang(lang, settled);

  if (cms.loading || !allowed) return null;

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const platform = platformAdmin
    ? ADMIN_NAV.map((s) => ({
        key: s.key,
        label: s.label[lang],
        items: s.items.map((i) => ({ ...i, label: i.label[lang], active: isActive(i.href) })),
      }))
    : [];
  const sections = [...platform, ...cms.sections];
  const current = sections.flatMap((s) => s.items).find((i) => i.active);

  return (
    <UiStringsProvider lang={lang}>
    <AppLayout
      dir={isAr ? "rtl" : "ltr"}
      style={{ fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
      sidebar={
        <AppSidebar
          label={copy.area}
          title={copy.area}
          titleHref={platformAdmin ? "/admin" : CMS_HOME}
          isAr={isAr}
          storageKey={SIDEBAR_RAILS.admin}
          sections={sections}
          footer={[{ key: "notifications", label: isAr ? "الإشعارات" : "Notifications", icon: "bell", href: "/notifications" }, { key: "studio", label: copy.back, icon: "arrow-left", href: "/brands" }]}
        />
      }
      topbar={
        <AppTopBar
          title={current?.label}
          right={
            <>
              <LangToggle value={lang} onChange={(next) => setAdminLang(next)} label={copy.language} scope="chrome" />
              {/* On a phone the theme toggle moves into the account menu. */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <AccountMenu />
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
