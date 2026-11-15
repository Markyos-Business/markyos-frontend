"use client";

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppSidebar, AppTopBar, EmptyState, LangToggle, ThemeToggle, UiStringsProvider } from "@/components/ui";
import { useApp, useAppActions, useSession } from "@/contexts/AppContext";
import { useDocumentLang } from "@/contexts/useInterfaceLang";
import { AccountMenu } from "@/features/account";
import { AppLayout, PageContainer } from "@/features/shell";
import { API_ENABLED } from "@/lib/api/client";
import { SIDEBAR_RAILS } from "@/lib/sidebarRails";
import { KINDS } from "../../copy";
import { useContentLang } from "../../hooks/use-content-lang";
import { useContentMe } from "../../hooks/use-content-me";

/**
 * The website-content area's frame, and its gate.
 *
 * Open to anyone the server gives a content role: platform admins, and the
 * editors and viewers a content admin added. The sidebar lists only the
 * sections this person can open. The server refuses everything else anyway;
 * this keeps people from landing on a page of errors.
 */
export function ContentShell({ children }: { children: ReactNode }) {
  const { hydrated } = useApp();
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, session, router, pathname]);

  // Only once the session is restored: asking the server before the sign-in
  // token is back answers 401, and the area would say "no access".
  if (!API_ENABLED || !hydrated || !session) return null;
  return <ContentFrame>{children}</ContentFrame>;
}

function ContentFrame({ children }: { children: ReactNode }) {
  const { setAdminLang } = useAppActions();
  const pathname = usePathname();
  const params = useSearchParams();
  const { lang, isAr, settled, c } = useContentLang();
  const me = useContentMe();
  // Toasts and dialogs render at the document root; they read <html dir>.
  useDocumentLang(lang, settled);

  if (me.loading) return null;

  const role = me.data?.role ?? null;
  const sections = me.data?.sections ?? [];
  const kind = params.get("kind");
  const onList = pathname === "/content";
  const nav = [
    {
      key: "articles",
      label: c.allContent,
      items: [
        { key: "all", label: c.allContent, icon: "globe", href: "/content", active: onList && !kind },
        ...KINDS.filter((k) => sections.includes(k.kind)).map((k) => ({
          key: k.kind,
          label: k.label[lang],
          icon: k.icon,
          href: `/content?kind=${k.kind}`,
          active: onList && kind === k.kind,
        })),
      ],
    },
  ];

  return (
    <UiStringsProvider lang={lang}>
      <AppLayout
        dir={isAr ? "rtl" : "ltr"}
        style={{ fontFamily: isAr ? "var(--font-arabic)" : "var(--font-sans)" }}
        sidebar={
          role ? (
            <AppSidebar
              label={c.area}
              title={c.area}
              titleHref="/content"
              isAr={isAr}
              storageKey={SIDEBAR_RAILS.admin}
              sections={nav}
              footer={[{ key: "studio", label: c.back, icon: "arrow-left", href: "/brands" }]}
            />
          ) : undefined
        }
        topbar={
          <AppTopBar
            title={c.area}
            right={
              <>
                <LangToggle value={lang} onChange={(next) => setAdminLang(next)} label={c.language} scope="chrome" />
                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>
                <AccountMenu controls={<ThemeToggle />} />
              </>
            }
          />
        }
      >
        <PageContainer>
          {role ? children : <EmptyState icon="lock" title={c.noAccess} description="" />}
        </PageContainer>
      </AppLayout>
    </UiStringsProvider>
  );
}
