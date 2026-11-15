"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { AuthLayout, LangToggle, MarkyosLogo } from "@/components/ui";
import { useDocumentLang } from "@/contexts/useInterfaceLang";
import { useAuthLang } from "../../hooks/shared/use-auth-lang";

/**
 * The frame around every signed-out screen: the kit's AuthLayout with the
 * auth pages' logo link and language switch.
 *
 * Login, registration and password reset were three separately-built pages
 * that happened to look similar, which is how the logo ended up a different
 * size on one of them and the footer link a different colour on another. One
 * component means the three genuinely match, and a fourth screen inherits the
 * layout instead of re-deriving it.
 *
 * `<main>` and a real `<h1>` because these are the only pages someone can
 * reach with no session: if the heading structure is wrong anywhere, it is
 * worst here, at the door.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { lang, setLang, c, settled } = useAuthLang();
  useDocumentLang(lang, settled);
  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      footer={footer}
      // Arabic first; the switch is here because these are the screens
      // someone sees before they have an account to keep a choice on.
      corner={<LangToggle value={lang} onChange={setLang} label={c.langSwitch} scope="chrome" />}
      brand={
        <Link href="/" aria-label={c.home}>
          <MarkyosLogo variant="lockup" className="w-[190px] max-w-full" isAr={lang === "ar"} />
        </Link>
      }
    >
      {children}
    </AuthLayout>
  );
}
